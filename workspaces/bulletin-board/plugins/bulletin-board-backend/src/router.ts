import express from 'express';
import Router from 'express-promise-router';
import { Config } from '@backstage/config';
import { DatabaseHandler } from './service/persistence/DatabaseHandler';
import { DatabaseService, LoggerService } from '@backstage/backend-plugin-api';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';

/** @public */
export interface RouterOptions {
  logger: LoggerService;
  database: DatabaseService;
  config: Config;
}

/** @private */
export async function createRouter(
  routerOptions: RouterOptions,
): Promise<express.Router> {
  const { logger, database, config } = routerOptions;

  const dbHandler = await DatabaseHandler.create({ database });
  logger.info('Initializing Bulletin Board backend');

  const router = Router();
  router.use(express.json());

  router.get('/bulletins', async (_req, res) => {
    const bulletins = await dbHandler.getBulletins();

    if (bulletins?.length) {
      res.json({ status: 'ok', data: bulletins });
    } else {
      res.json({ status: 'ok', data: [] });
    }
  });

  router.post('/bulletins', async (req, res) => {
    const body = req.body;
    await dbHandler.createBulletin(body);
    res.json({ status: 'ok' });
  });

  router.patch('/bulletins/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const count = await dbHandler.updateBulletin(id, body);

    if (count) {
      res.json({ status: 'ok' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  });

  router.delete('/bulletins/:id', async (req, res) => {
    const { id } = req.params;
    const count = await dbHandler.deleteBulletin(id);

    if (count) {
      res.json({ status: 'ok' });
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());
  
  return router;
}

/** @public */
export async function createRouterFromConfig(routerOptions: RouterOptions) {
  return createRouter(routerOptions);
}
