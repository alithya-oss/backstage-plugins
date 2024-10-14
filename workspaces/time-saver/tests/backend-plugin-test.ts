/*
 * Copyright 2020 The Backstage Authors
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

import { test, expect, request } from '@playwright/test';

test.describe('Time Saver API tests', () => {
  // Global request context for API tests
  let apiContext;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await request.newContext({
      baseURL: 'http://localhost:7007/api/time-saver', // Update with actual base URL
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJ0eXAiOiJ2bmQuYmFja3N0YWdlLnVzZXIiLCJhbGciOiJFUzI1NiIsImtpZCI6ImFjMjI4MDBlLWJjYzYtNGIzZS04Nzk0LTNhOTgxZmYyNWJiZSJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcwMDcvYXBpL2F1dGgiLCJzdWIiOiJ1c2VyOmRldmVsb3BtZW50L2d1ZXN0IiwiZW50IjpbInVzZXI6ZGV2ZWxvcG1lbnQvZ3Vlc3QiXSwiYXVkIjoiYmFja3N0YWdlIiwiaWF0IjoxNzI4OTIyNzI5LCJleHAiOjE3Mjg5MjYzMjksInVpcCI6ImY1Uk1CVzVPZ3NqMTg0ekhFaEk5LU0wclZrV1lSeDIxaXF4dWFIbXVJZHYwckYxMThUNXRNSFhMY2RUQk5nM3JKbHlZV1hrUVhhdlI1eHhQRDRmUE9BIn0.F7Ovv1NYff8B5Nq4oqmgVyY6pbrWBHQfIQkvd7_bFMPRAX6YgQF_WpMFsNDAMtpHruZTDYj8jq270t5aJ-ZVnQ', // Replace with your token if required
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  //  ---------------------------
  //  General metrics

  // Test: Retrieve all teams
  test('GET /groups - Retrieve all teams', async () => {
    const response = await apiContext.get(`/api/time-saver/groups`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('groups');
    expect(Array.isArray(body.groups)).toBeTruthy();
  });

  // Test: Retrieve all templates
  test('GET /templates - Retrieve all templates', async () => {
    const response = await apiContext.get(`/api/time-saver/templates`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('templates');
    expect(Array.isArray(body.templates)).toBeTruthy();
  });

  // Test: Retrieve all templateTasks
  test('GET /templateTasks - Retrieve all templateTasks', async () => {
    const response = await apiContext.get(`/api/time-saver/templateTasks`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('templateTasks');
    expect(Array.isArray(body.templateTasks)).toBeTruthy();
  });

  // Test: Retrieve all templateCount
  test('GET /getTemplateCount - Retrieve template count', async () => {
    const response = await apiContext.get(`/api/time-saver/getTemplateCount`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('count');
    expect(typeof body.count === 'number').toBeTruthy();
  });

  // Test: Retrieve all templateTasks
  test('GET /getTimeSavedSum - Retrieve total time saved', async () => {
    const response = await apiContext.get(`/api/time-saver/getTimeSavedSum`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('timeSaved');
    expect(typeof body.timeSaved === 'number').toBeTruthy();
  });

  //  ---------------------------
  //  Statistics

  // Test: Retrieve time savings stats by template ID
  // test(`GET /getStats?templateId={templateId} - Retrieve time saved statistics for a given template task`, async () => {
  //   const templateId = 'example-template-task-id'; // Replace with actual ID
  //   const response = await apiContext.get(`/api/time-saver/getStats?templateId=${templateId}`);
  //   expect(response.status()).toBe(200);

  //   const body = await response.json();
  //   expect(body).toHaveProperty('templateTaskId', templateId);
  //   expect(body).toHaveProperty('stats');
  // });

  // Test: Retrieve time savings stats by team name
  test(`GET /getStats?team={team} - Retrieve time saved statistics for a given team`, async () => {
    const teamName = 'security'; // Replace with actual ID
    const response = await apiContext.get(
      `/api/time-saver/getStats?team=${teamName}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('team', teamName);
    expect(body).toHaveProperty('stats');
  });

  // Test: Retrieve time savings stats by template name
  test(`GET /getStats?templateName={templateName} - Retrieve time saved statistics for a given template`, async () => {
    const templateName = 'template:default/example-code-testing-template'; // Replace with actual ID
    const response = await apiContext.get(
      `/api/time-saver/getStats?templateName=${templateName}`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('templateName', templateName);
    expect(body).toHaveProperty('stats');
  });

  // Test: Retrieve group-divided time savings stats
  test('GET /getStats/group - Retrieve group-divided stats', async () => {
    const response = await apiContext.get(`/api/time-saver/getStats/group`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('stats');
  });

  //  ---------------------------
  //  Time Summary

  // Test: Retrieve time saved per day per team
  test('GET /getDailyTimeSummary/team - Retrieve time saved per day per team', async () => {
    const response = await apiContext.get(
      `/api/time-saver/getDailyTimeSummary/team`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('stats');
  });

  // Test: Retrieve time saved per day per template
  test('GET /getDailyTimeSummary/template - Retrieve time saved per day per template', async () => {
    const response = await apiContext.get(
      `/api/time-saver/getDailyTimeSummary/template`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('stats');
  });

  // Test: Retrieve time saved per team
  test('GET /getTimeSummary/team - Retrieve time saved per team', async () => {
    const response = await apiContext.get(
      `/api/time-saver/getTimeSummary/team`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('stats');
  });

  // Test: Retrieve time saved per template
  test('GET /getTimeSummary/template - Retrieve time saved per template', async () => {
    const response = await apiContext.get(
      `/api/time-saver/getTimeSummary/template`,
    );
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('stats');
  });
});
