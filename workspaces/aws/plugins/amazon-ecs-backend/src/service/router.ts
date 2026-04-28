/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import express from 'express';
import Router from 'express-promise-router';
import { AmazonECSService } from './types';
import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';

/** @public */
export interface RouterOptions {
  logger: LoggerService;
  amazonEcsApi: AmazonECSService;
  httpAuth: HttpAuthService;
}

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, amazonEcsApi, httpAuth } = options;

  const router = Router();
  router.use(express.json());

  router.get(
    '/v1/entity/:namespace/:kind/:name/services',
    async (request, response) => {
      const { namespace, kind, name } = request.params;

      const services = await amazonEcsApi.getServicesByEntity({
        entityRef: {
          kind,
          namespace,
          name,
        },
        credentials: await httpAuth.credentials(request),
      });
      response.status(200).json(services);
    },
  );

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  return router;
}

export * from './DefaultAmazonEcsService';
