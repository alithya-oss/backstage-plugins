/*
 * Copyright 2026 The Alithya Authors
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

import type {
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { ArgoWorkflowsService } from './service';
import type { ServiceError } from './service';

/** @public */
export interface RouterOptions {
  logger: LoggerService;
  config: Config;
  httpAuth: HttpAuthService;
}

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;
  const router = Router();

  const service = new ArgoWorkflowsService({ logger, config });

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  router.get('/workflows/:namespace', async (req, res) => {
    const { namespace } = req.params;
    const labelSelector = req.query.labelSelector as string | undefined;
    const rawLimit = parseInt(req.query.limit as string, 10) || 20;
    const rawOffset = parseInt(req.query.offset as string, 10) || 0;
    const limit = Math.max(1, Math.min(100, rawLimit));
    const offset = Math.max(0, rawOffset);

    try {
      const workflows = await service.listWorkflows(namespace, {
        labelSelector,
        limit,
        offset,
      });
      res.json(workflows);
    } catch (err: any) {
      const statusCode = (err as ServiceError).statusCode ?? 500;
      const code = (err as ServiceError).code ?? 'INTERNAL_ERROR';
      const message = err.message ?? 'An unexpected error occurred';
      res.status(statusCode).json({
        error: { message, code, statusCode },
      });
    }
  });

  logger.info('Argo Workflows backend plugin initialized');
  return router;
}
