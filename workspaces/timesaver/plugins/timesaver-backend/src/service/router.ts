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
  router.get('/groups', async (_, response) => {
    return response.json({
      msg: 'groups',
      status: 'ok',
    });
  });

  //  Get all templates
  router.get('/templates', async (_, response) => {
    return response.json({
      msg: 'templates',
      status: 'ok',
    });
  });

  //  Get all templates tasks
  router.get('/templatesTasks', async (_, response) => {
    return response.json({
      msg: 'templatesTasks',
      status: 'ok',
    });
  });

  //  Get all templates count
  router.get('/templatesCount', async (_, response) => {
    return response.json({
      msg: 'templatesCount',
      status: 'ok',
    });
  });

  //  Get time saved sum
  router.get('/timeSavedSum', async (_, response) => {
    return response.json({
      msg: 'timeSavedSum',
      status: 'ok',
    });
  });

  //  Get savings
  router.get('/savings', async (_, response) => {
    return response.json({
      msg: 'savings',
      status: 'ok',
    });
  });

  //  Get statistics
  router.get('/statistics', async (request, response) => {
    const { groupId } = request.query;
    if (groupId) {
      return response.json({
        msg: `/statistics?groupId=${groupId}`,
        status: 'ok',
      });
    }
    return response.json({
      msg: `statistics`,
      status: 'ok',
    });
  });

  //  Get daily time summary per team
  router.get('/dailyTimeSum', async (request, response) => {
    const { teamId, templateId } = request.query;
    if (teamId) {
      return response.json({
        msg: `/dailyTimeSum?teamId=${teamId}`,
        status: 'ok',
      });
    } else if (templateId) {
      return response.json({
        msg: `/dailyTimeSum?templateId=${templateId}`,
        status: 'ok',
      });
    }
    return response.json({
      msg: 'dailyTimeSum',
      status: 'ok',
    });
  });

  //  Get time summary per team
  router.get('/timeSum', async (request, response) => {
    const { teamId, templateId } = request.query;
    if (teamId) {
      return response.json({
        msg: `/timeSum?teamId=${teamId}`,
        status: 'ok',
      });
    } else if (templateId) {
      return response.json({
        msg: `/timeSum?templateId=${templateId}`,
        status: 'ok',
      });
    }
    return response.json({
      msg: 'timeSum',
      status: 'ok',
    });
  });

  //  Execute migration
  router.get('/migrateTemplatesTasks', async (_, response) => {
    return response.json({
      msg: '/migrateTemplatesTasks',
      status: 'ok',
    });
  });

  const middleware = MiddlewareFactory.create({ logger, config });

  router.use(middleware.error());
  return router;
}
