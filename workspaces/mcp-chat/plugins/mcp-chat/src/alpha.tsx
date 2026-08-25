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
import { RiChat3Line } from '@remixicon/react';
import {
  rootRouteRef,
  promptRouteRef,
  mcpChatApiRef,
  McpChat,
  chatPageContentLoader,
  promptPageContentLoader,
} from './wiring';
import { BotIconComponent } from './components/BotIcon';

/**
 * MCP Chat Api
 * @public
 */
const mcpChatApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: mcpChatApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new McpChat({ discoveryApi, fetchApi }),
    }),
});

/**
 * MCP Chat Page
 * @public
 */
const mcpChatPage = PageBlueprint.make({
  params: {
    path: '/mcp-chat',
    title: 'MCP Chat',
    icon: <BotIconComponent />,
    loader: async () => {
      const Component = await chatPageContentLoader();
      return <Component />;
    },
    routeRef: rootRouteRef,
  },
});

/**
 * MCP Chat Prompt Page
 *
 * Assistant UI conversation page. It is a sibling of {@link mcpChatPage}, not a
 * child of it: both are mounted independently and neither shadows the other.
 * @public
 */
const mcpChatPromptPage = PageBlueprint.make({
  name: 'prompt',
  params: {
    path: '/mcp-chat-prompt',
    title: 'MCP Prompt',
    icon: <RiChat3Line />,
    loader: async () => {
      const Component = await promptPageContentLoader();
      return <Component />;
    },
    routeRef: promptRouteRef,
  },
});

/**
 * MCP Chat plugin.
 * @public
 */
const mcpChatPlugin = createFrontendPlugin({
  pluginId: 'mcp-chat',
  extensions: [mcpChatApi, mcpChatPage, mcpChatPromptPage],
  routes: {
    root: rootRouteRef,
    prompt: promptRouteRef,
  },
});

export default mcpChatPlugin;
