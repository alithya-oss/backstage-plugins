/*
 * Copyright 2024 Larder Software Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Request, Response } from 'express';
import { LlmService } from './LlmService';
import {
  AugmentationIndexer,
  EmbeddingsSource,
  RetrievalPipeline,
} from '@alithya-oss/backstage-plugin-rag-ai-node';
import {
  AuthService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';

export class RagAiController {
  private logger: LoggerService;
  private static instance: RagAiController;
  private readonly llmService: LlmService;
  private readonly augmentationIndexer: AugmentationIndexer;
  private readonly retrievalPipeline?: RetrievalPipeline;

  constructor(
    logger: LoggerService,
    llmService: LlmService,
    augmentationIndexer: AugmentationIndexer,
    retrievalPipeline?: RetrievalPipeline,
  ) {
    this.logger = logger;
    this.llmService = llmService;
    this.augmentationIndexer = augmentationIndexer;
    this.retrievalPipeline = retrievalPipeline;
  }

  static getInstance({
    logger,
    llmService,
    augmentationIndexer,
    retrievalPipeline,
  }: {
    logger: LoggerService;
    llmService: LlmService;
    augmentationIndexer: AugmentationIndexer;
    retrievalPipeline?: RetrievalPipeline;
    auth?: AuthService;
    httpAuth?: HttpAuthService;
  }): RagAiController {
    if (!RagAiController.instance) {
      RagAiController.instance = new RagAiController(
        logger,
        llmService,
        augmentationIndexer,
        retrievalPipeline,
      );
    }
    return RagAiController.instance;
  }

  createEmbeddings = async (req: Request, res: Response) => {
    const source = req.params.source as EmbeddingsSource;
    const entityFilter = req.body.entityFilter;

    this.logger.info(`Creating embeddings for source ${source}`);
    const amountOfEmbeddings = await this.augmentationIndexer.createEmbeddings(
      source,
      entityFilter,
    );
    return res.status(200).send({
      response: `${amountOfEmbeddings} embeddings created for source ${source}, for entities with filter ${JSON.stringify(
        entityFilter,
      )}`,
    });
  };

  getEmbeddings = async (req: Request, res: Response) => {
    if (!this.retrievalPipeline) {
      return res.status(500).send({
        message: 'No retrieval pipeline configured for this AI backend. ',
      });
    }

    const source = req.params.source as EmbeddingsSource;
    const query = req.query.query as string;
    const entityFilter = req.body.entityFilter;

    const response = await this.retrievalPipeline.retrieveAugmentationContext(
      query,
      source,
      entityFilter,
    );
    return res.status(200).send({ response });
  };

  deleteEmbeddings = async (req: Request, res: Response) => {
    const source = req.params.source as EmbeddingsSource;
    const entityFilter = req.body.entityFilter;
    await this.augmentationIndexer.deleteEmbeddings(source, entityFilter);
    return res
      .status(201)
      .send({ response: `Embeddings deleted for source ${source}` });
  };

  query = async (req: Request, res: Response) => {
    // TODO: Remove the need for source in query when we have magical abilities to create very good embeddings
    const source = req.params.source as EmbeddingsSource;
    const query = req.body.query;
    const entityFilter = req.body.entityFilter;

    res.writeHead(200, {
      // TODO:investigate why this results in buffered response in the frontend
      // 'Content-Type': 'text/event-stream',
      Connection: 'kee-alive',
      'Cache-Control': 'no-cache',
    });

    const embeddingDocs = this.retrievalPipeline
      ? await this.retrievalPipeline.retrieveAugmentationContext(
          query,
          source,
          entityFilter,
        )
      : [];

    const embeddingsEvent = `event: embeddings\n`;
    const embeddingsData = `data: ${JSON.stringify(embeddingDocs)}\n\n`;
    res.write(embeddingsEvent + embeddingsData);

    const stream = await this.llmService.query(embeddingDocs, query);

    for await (const chunk of stream) {
      const text = typeof chunk === 'string' ? chunk : chunk.content;
      const event = `event: response\n`;
      const data = `data: ${text}\n\n`;
      res.write(event + data);
    }

    res.end();
  };
}
