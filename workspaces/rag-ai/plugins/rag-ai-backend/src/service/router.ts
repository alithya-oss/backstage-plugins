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

import {
  errorHandler,
  createLegacyAuthAdapters,
} from '@backstage/backend-common';
import express, { NextFunction, Request, Response } from 'express';
import Router from 'express-promise-router';
import { AugmentationIndexer, RetrievalPipeline } from '@alithya-oss/plugin-rag-ai-node';
import { BaseLLM } from '@langchain/core/language_models/llms';
import { LlmService } from './LlmService';
import { RagAiController } from './RagAiController';
import { isEmpty } from 'lodash';
import { Config } from '@backstage/config';
import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';

type AiBackendConfig = {
  prompts: {
    prefix: string;
    suffix: string;
  };
  supportedSources: string[];
};

export interface RouterOptions {
  augmentationIndexer: AugmentationIndexer;
  retrievalPipeline: RetrievalPipeline;
  model: BaseLLM;
  discovery?: DiscoveryService;
  config: Config;
  logger: LoggerService;
  auth?: AuthService;
  httpAuth?: HttpAuthService;
}

const sourceValidator =
  (supportedSources: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const source = req.params.source;
    if (!supportedSources.includes(source) && source !== 'all') {
      return res.status(422).json({
        message: `Only ${supportedSources.join(
          ', ',
        )} are supported as AI assistant query sources for now.`,
      });
    }
    return next();
  };

const queryQueryValidator = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const query = req.query.query;
  if (!query || typeof query !== 'string' || isEmpty(query)) {
    return res.status(422).json({
      message: 'You should pass in the query via query params',
    });
  }
  return next();
};
const bodyQueryValidator = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const query = req.body.query;
  if (!query || typeof query !== 'string' || isEmpty(query)) {
    return res.status(422).json({
      message: 'You should pass in the query via request body',
    });
  }
  return next();
};

/**
 * @public
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const {
    augmentationIndexer,
    retrievalPipeline,
    model,
    discovery,
    config,
    logger,
  } = options;

  const { auth, httpAuth } = createLegacyAuthAdapters({
    ...options,
    discovery,
  });

  const aiBackendConfig = config.getOptional<AiBackendConfig>('ai');
  const supportedSources = aiBackendConfig?.supportedSources ?? ['catalog'];

  const llmService = new LlmService({
    logger,
    model,
    configuredPrompts: aiBackendConfig?.prompts,
  });

  const controller = RagAiController.getInstance({
    logger,
    augmentationIndexer,
    retrievalPipeline,
    llmService,
  });

  const router = Router();
  router.use(express.json());

  const sourceValidatorMiddleware = sourceValidator(supportedSources);

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router
    .route('/embeddings/:source')
    .post(sourceValidatorMiddleware, controller.createEmbeddings)
    .delete(sourceValidatorMiddleware, controller.deleteEmbeddings)
    .get(
      sourceValidatorMiddleware,
      queryQueryValidator,
      controller.getEmbeddings,
    );

  router
    .route('/query/:source')
    .post(sourceValidatorMiddleware, bodyQueryValidator, controller.query);

  router.use(errorHandler());
  return router;
}
