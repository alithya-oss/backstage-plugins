/*
 * Copyright 2024 The Backstage Authors
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
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskInvocationDefinition,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  createServiceBuilder,
  loadBackendConfig,
} from '@backstage/backend-common';
import { Server } from 'http';
import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';
import { UrlReaders } from '@backstage/backend-defaults/urlReader';
import { DatabaseManager } from '@backstage/backend-defaults/database';
import { HostDiscovery } from '@backstage/backend-defaults/discovery';

export interface ServerOptions {
  port: number;
  enableCors: boolean;
  logger: LoggerService;
}

export async function startStandaloneServer(
  options: ServerOptions,
): Promise<Server> {
  const logger = options.logger.child({ service: 'time-saver-backend' });
  const config = await loadBackendConfig({ logger, argv: process.argv });
  const discovery = HostDiscovery.fromConfig(config);

  class PersistingSchedulerServiceTaskRunner
    implements SchedulerServiceTaskRunner
  {
    private tasks: SchedulerServiceTaskInvocationDefinition[] = [];

    getTasks() {
      return this.tasks;
    }

    run(task: SchedulerServiceTaskInvocationDefinition): Promise<void> {
      this.tasks.push(task);
      return Promise.resolve(undefined);
    }
  }

  const schedulerServiceTaskRunner = new PersistingSchedulerServiceTaskRunner();
  const scheduler = {
    createScheduledSchedulerServiceTaskRunner: (_: unknown) =>
      schedulerServiceTaskRunner,
  } as unknown as SchedulerService;
  //  TODO : Validate createScheduledSchedulerServiceTaskRunner type

  const manager = DatabaseManager.fromConfig(
    new ConfigReader({
      backend: {
        database: { client: 'better-sqlite3', connection: ':memory:' },
      },
    }),
  );
  const database = manager.forPlugin('time-saver');
  logger.debug('Starting application server...');
  const router = await createRouter({
    logger,
    config,
    database,
    discovery,
    scheduler,
    urlReader: UrlReaders.default({ logger, config }),
  });

  let service = createServiceBuilder(module)
    .setPort(options.port)
    .addRouter('/time-saver', router);
  if (options.enableCors) {
    service = service.enableCors({ origin: 'http://localhost:3000' });
  }

  return await service.start().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}

module.hot?.accept();
