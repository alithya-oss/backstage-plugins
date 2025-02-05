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
  LoggerService,
  DatabaseService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { applyDatabaseMigrations } from '../database/migrations';
import { RoadieVectorStore } from '@alithya-oss/backstage-plugin-rag-ai-node';
import { RoadiePgVectorStore } from './RoadiePgVectorStore';

/** @public */
export interface PgVectorStoreInitConfig {
  logger: LoggerService;
  database: DatabaseService;
  config: RootConfigService;
}

/**
 * Options for {@link createRoadiePgVectorStore}
 *
 * @public
 */
export interface RoadiePgVectorStoreOptions {
  chunkSize?: number;
  amount?: number;
}

/** @public */
export async function createRoadiePgVectorStore({
  logger,
  database,
  config,
}: PgVectorStoreInitConfig): Promise<RoadieVectorStore> {
  logger.info('Starting Roadie PgVectorStore');

  const dbClient = await database.getClient();
  await applyDatabaseMigrations(dbClient);

  const pgVectorConfig = config.getOptionalConfig('ai.storage.pgVector');
  const options: RoadiePgVectorStoreOptions = {};
  if (pgVectorConfig) {
    options.amount = pgVectorConfig.getOptionalNumber('amount');
    options.chunkSize = pgVectorConfig.getOptionalNumber('chunkSize');
  }

  return RoadiePgVectorStore.initialize({
    logger,
    db: dbClient,
    chunkSize: options?.chunkSize,
    amount: options?.amount,
  });
}
