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

import { ComponentType } from 'react';
import {
  createPlugin,
  createRoutableExtension,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import {
  rootRouteRef,
  promptRouteRef,
  mcpChatApiRef,
  McpChat,
  chatPageLoader,
  promptPageLoader,
} from './wiring';
import { BotIconComponent } from './components/BotIcon';

/**
 * MCP Chat plugin.
 @public
 */

export const mcpChatPlugin = createPlugin({
  id: 'mcp-chat',
  routes: {
    root: rootRouteRef,
    prompt: promptRouteRef,
  },
  apis: [
    createApiFactory({
      api: mcpChatApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new McpChat({ discoveryApi, fetchApi }),
    }),
  ],
});

/**
 * MCP Chat Page
 * @public
 */
export const McpChatPage = mcpChatPlugin.provide(
  createRoutableExtension({
    name: 'McpChatPage',
    component: chatPageLoader,
    mountPoint: rootRouteRef,
  }),
);

/**
 * MCP Chat Prompt Page
 *
 * Assistant UI conversation page for the legacy entry point. It mounts on its own
 * route ref, so it is a sibling of {@link McpChatPage} rather than a replacement:
 * an app may mount either or both.
 * @public
 */
export const McpChatPromptPage = mcpChatPlugin.provide(
  createRoutableExtension({
    name: 'McpChatPromptPage',
    component: promptPageLoader,
    mountPoint: promptRouteRef,
  }),
);

/**
 * MCP Chat Icon
 * @public
 */
export const MCPChatIcon: ComponentType<{
  fontSize?: 'medium' | 'large' | 'small' | 'inherit';
}> = BotIconComponent;
