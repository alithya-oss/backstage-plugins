import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';

export interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  //  Get all groups

  //  Get all templates

  //  Get all templates tasks

  //  Get all templates count

  //  Get time saved sum

  //  Get savings

  //  Get statistics

  //  Get stats per group

  //  Get daily time summary per team

  //  Get daily time summary per template

  //  Get time summary per team

  //  Get time summary per template

  //  Execute migration

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
