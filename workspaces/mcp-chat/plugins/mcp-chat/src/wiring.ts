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

import { createRouteRef } from '@backstage/core-plugin-api';

/**
 * Root route reference for the MCP Chat plugin.
 * Shared between the legacy and alpha entry points.
 */
export const rootRouteRef = createRouteRef({ id: 'mcp-chat' });

export { mcpChatApiRef } from './api';
export { McpChat } from './api/McpChatApi';

/**
 * Lazy loader for the chat page component (legacy entry point).
 * Wraps content with Page/Content shell.
 */
export const chatPageLoader = () =>
  import('./components/ChatPage').then(m => m.ChatPage);

/**
 * Lazy loader for the chat page content (alpha entry point).
 * Returns the inner content without Page/Content wrapper —
 * PageBlueprint provides the page shell.
 */
export const chatPageContentLoader = () =>
  import('./components/ChatPage').then(m => m.ChatPageContent);
