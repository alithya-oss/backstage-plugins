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

import {
  ApiBlueprint,
  createFrontendPlugin,
  discoveryApiRef,
  fetchApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { RiRobot2Line } from '@remixicon/react';
import { AgentApiClient, agentApiRef } from './api';
import { rootRouteRef } from './routes';

/**
 * Agent API used by the chat page to talk to the GenAI backend.
 */
const agentApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: agentApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AgentApiClient({ discoveryApi, fetchApi }),
    }),
});

/**
 * Agent chat page, mounted per agent name.
 */
const agentChatPage = PageBlueprint.make({
  params: {
    path: '/aws-genai/:agentName',
    routeRef: rootRouteRef,
    loader: () =>
      import('./components/AgentPage').then(m => <m.NfsAgentPage />),
  },
});

/**
 * AWS GenAI plugin for the new frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'aws-genai',
  title: 'Chat Assistant',
  icon: <RiRobot2Line />,
  extensions: [agentApi, agentChatPage],
  routes: {
    root: rootRouteRef,
  },
});

export { NfsAgentPage as AgentChatPage } from './components/AgentPage';
