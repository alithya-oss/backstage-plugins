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

import { createDevApp } from '@backstage/dev-utils';
import { RiChat3Line } from '@remixicon/react';
import {
  mcpChatPlugin,
  McpChatPage,
  McpChatPromptPage,
  MCPChatIcon,
} from '../src/plugin';

// Remix icons declare a wider `fontSize` than Backstage's IconComponent, so the
// icon is wrapped rather than passed directly.
const PromptIcon = () => <RiChat3Line />;

createDevApp()
  .registerPlugin(mcpChatPlugin)
  .addPage({
    element: <McpChatPage />,
    title: 'MCP Chat',
    path: '/',
    icon: MCPChatIcon,
  })
  .addPage({
    element: <McpChatPromptPage />,
    title: 'MCP Prompt',
    path: '/mcp-chat-prompt',
    icon: PromptIcon,
  })
  .render();
