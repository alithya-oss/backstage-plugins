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

import { renderTestApp } from '@backstage/frontend-test-utils';
import { screen } from '@testing-library/react';
import awsGenAiPlugin from './alpha';
import { agentApiRef } from './api';
import { rootRouteRef } from './routes';

jest.mock('./components/AgentPage', () => ({
  NfsAgentPage: () => <div>agent chat page content</div>,
}));

describe('aws-genai alpha plugin', () => {
  it('should be wired for the new frontend system', () => {
    expect(awsGenAiPlugin.pluginId).toBe('aws-genai');
    expect(awsGenAiPlugin.routes.root).toBe(rootRouteRef);
    expect(awsGenAiPlugin.getExtension('api:aws-genai')).toBeDefined();
    expect(awsGenAiPlugin.getExtension('page:aws-genai')).toBeDefined();
    expect(agentApiRef.id).toBe('plugin.aws-genai-agent.service');
  });

  it('should render the chat page on the agent route', async () => {
    renderTestApp({
      features: [awsGenAiPlugin],
      initialRouteEntries: ['/aws-genai/my-agent'],
    });

    expect(
      await screen.findByText('agent chat page content'),
    ).toBeInTheDocument();
  });
});
