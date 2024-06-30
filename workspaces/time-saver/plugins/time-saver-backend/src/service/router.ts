import {
  PluginDatabaseManager,
  errorHandler,
  loggerToWinstonLogger,
} from '@backstage/backend-common';
import {
  PluginTaskScheduler,
  readTaskScheduleDefinitionFromConfig,
  TaskScheduleDefinition,
} from '@backstage/backend-tasks';
import express from 'express';
import Router from 'express-promise-router';
import { Config } from '@backstage/config';
import { PluginInitializer } from './pluginInitializer';
import { LoggerService } from '@backstage/backend-plugin-api';

export interface PluginOptions {
  backwar?: TaskScheduleDefinition;
  batchSize?: number;
  useSourceLocation?: boolean;
  linguistJsOptions?: Record<string, unknown>;
  kind?: string[];
}

export interface RouterOptions {
  logger: LoggerService;
  database: PluginDatabaseManager;
  config: Config;
  scheduler: PluginTaskScheduler;
}

function registerRouter() {
  const router = Router();
  router.use(express.json());
  return router;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, database, scheduler } = options;
  const baseRouter = registerRouter();
  const plugin = await PluginInitializer.builder(
    baseRouter,
    logger,
    config,
    database,
    scheduler,
  );
  const router = plugin.timeSaverRouter;
  router.use(errorHandler());
  return router;
}

/** @public */
export async function createRouterFromConfig(routerOptions: RouterOptions) {
  const { config } = routerOptions;
  const pluginOptions: PluginOptions = {};
  if (config) {
    if (config.has('timesaver.schedule')) {
      pluginOptions.schedule = readTaskScheduleDefinitionFromConfig(
        config.getConfig('timesaver.schedule'),
      );
    }
    pluginOptions.batchSize = config.getOptionalNumber('timesaver.batchSize');
    pluginOptions.useSourceLocation =
      config.getOptionalBoolean('linguist.useSourceLocation') ?? false;
    pluginOptions.age = config.getOptional<JsonObject>('linguist.age') as
      | HumanDuration
      | undefined;
    pluginOptions.kind = config.getOptionalStringArray('linguist.kind');
    pluginOptions.linguistJsOptions = config.getOptionalConfig(
      'linguist.linguistJsOptions',
    );
  }
  return createRouter(pluginOptions, routerOptions);
}
