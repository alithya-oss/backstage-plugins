import { mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

describe('createRouter', () => {
  let app: express.Express;

  beforeAll(async () => {
    const router = await createRouter({
      logger: mockServices.logger.mock(),
      config: mockServices.rootConfig(),
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  const itTestApiEndpoint = (label: string, endpoint: string, status: {}) => {
    it(`${label}`, async () => {
      const response = await request(app).get(endpoint);

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(status);
    });
  };

  describe('GET /health', () => {
    itTestApiEndpoint('returns ok', '/health', { status: 'ok' });
  });

  describe('GET /groups', () => {
    itTestApiEndpoint('returns ok', '/groups', { msg: 'groups', status: 'ok' });
  });

  describe('GET /templates', () => {
    itTestApiEndpoint('returns ok', '/templates', {
      msg: 'templates',
      status: 'ok',
    });
  });

  describe('GET /templatesTasks', () => {
    itTestApiEndpoint('returns ok', '/templatesTasks', {
      msg: 'templatesTasks',
      status: 'ok',
    });
  });

  describe('GET /templatesCount', () => {
    itTestApiEndpoint('returns ok', '/templatesCount', {
      msg: 'templatesCount',
      status: 'ok',
    });
  });

  describe('GET /timeSavedSum', () => {
    itTestApiEndpoint('returns ok', '/timeSavedSum', {
      msg: 'timeSavedSum',
      status: 'ok',
    });
  });

  describe('GET /savings', () => {
    itTestApiEndpoint('returns ok', '/savings', {
      msg: 'savings',
      status: 'ok',
    });
  });

  describe('GET /statistics', () => {
    itTestApiEndpoint('returns ok', '/statistics', {
      msg: 'statistics',
      status: 'ok',
    });
  });

  describe('GET /statistics?groupId', () => {
    itTestApiEndpoint('returns ok', '/statistics?groupId=1', {
      msg: '/statistics?groupId=1',
      status: 'ok',
    });
  });

  describe('GET /dailyTimeSum', () => {
    itTestApiEndpoint('returns ok', '/dailyTimeSum', {
      msg: 'dailyTimeSum',
      status: 'ok',
    });
  });

  describe('GET /dailyTimeSum?teamId', () => {
    itTestApiEndpoint('returns ok', '/dailyTimeSum?teamId=1', {
      msg: '/dailyTimeSum?teamId=1',
      status: 'ok',
    });
  });

  describe('GET /dailyTimeSum?templateId', () => {
    itTestApiEndpoint('returns ok', '/dailyTimeSum?templateId=1', {
      msg: '/dailyTimeSum?templateId=1',
      status: 'ok',
    });
  });

  describe('GET /timeSum', () => {
    itTestApiEndpoint('returns ok', '/timeSum', {
      msg: 'timeSum',
      status: 'ok',
    });
  });

  describe('GET /timeSum?teamId', () => {
    itTestApiEndpoint('returns ok', '/timeSum?teamId=1', {
      msg: '/timeSum?teamId=1',
      status: 'ok',
    });
  });

  describe('GET /timeSum?templateId', () => {
    itTestApiEndpoint('returns ok', '/timeSum?templateId=1', {
      msg: '/timeSum?templateId=1',
      status: 'ok',
    });
  });

  describe('GET /migrateTemplatesTasks', () => {
    itTestApiEndpoint('returns ok', '/migrateTemplatesTasks', {
      msg: '/migrateTemplatesTasks',
      status: 'ok',
    });
  });
});
