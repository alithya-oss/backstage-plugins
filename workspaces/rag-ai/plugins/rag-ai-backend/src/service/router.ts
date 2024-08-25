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
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  LoggerService,
  AuthService,
  HttpAuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import express, { NextFunction, Request, Response } from 'express';
import Router from 'express-promise-router';
import {
  AugmentationIndexer,
  RetrievalPipeline,
} from '@alithya-oss/plugin-rag-ai-node';
import { BaseLLM } from '@langchain/core/language_models/llms';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { LlmService } from './LlmService';
import { RagAiController } from './RagAiController';
import { isEmpty } from 'lodash';
import { Config } from '@backstage/config';

const _sourceValidator =
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

const _queryQueryValidator = (
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

const _bodyQueryValidator = (
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

/** @public */
type AiBackendConfig = {
  prompts: {
    prefix: string;
    suffix: string;
  };
  supportedSources: string[];
};

/**
 * Router Options
 *
 * @public
 */ export interface RagAiRouterOptions {
  logger: LoggerService;
  augmentationIndexer: AugmentationIndexer;
  retrievalPipeline: RetrievalPipeline;
  model: BaseLLM | BaseChatModel;
  discovery: DiscoveryService;
  config: Config;
  auth?: AuthService;
  httpAuth?: HttpAuthService;
}

/**
 * @public
 */
export async function createRouter(
  options: RagAiRouterOptions,
): Promise<express.Router> {
  const { logger, augmentationIndexer, retrievalPipeline, model, config } =
    options;

  const aiBackendConfig = config.getOptional<AiBackendConfig>('ai');
  const supportedSources = aiBackendConfig?.supportedSources ?? ['catalog'];

  const llmService = new LlmService({
    logger,
    model,
    configuredPrompts: aiBackendConfig?.prompts,
  });

  const controller = RagAiController.getInstance({
    logger,
    auth,
    httpAuth,
    augmentationIndexer,
    retrievalPipeline,
    llmService,
  });

  const router = Router();
  router.use(express.json());

  const _sourceValidatorMiddleware = _sourceValidator(supportedSources);

  router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  router
    .route('/embeddings/:source')
    .post(_sourceValidatorMiddleware, controller.createEmbeddings)
    .delete(_sourceValidatorMiddleware, controller.deleteEmbeddings)
    .get(
      _sourceValidatorMiddleware,
      _queryQueryValidator,
      controller.getEmbeddings,
    );

  router
    .route('/query/:source')
    .post(_sourceValidatorMiddleware, _bodyQueryValidator, controller.query);

  router.use(MiddlewareFactory.create({ config, logger }).error());
  return router;
}
