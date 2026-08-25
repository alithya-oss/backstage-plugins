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

/**
 * Route references for the MCP Chat plugin.
 *
 * `rootRouteRef` is shared between the legacy and alpha entry points;
 * `promptRouteRef` is distinct so both pages stay independently routable.
 */
export { rootRouteRef, promptRouteRef } from './routes';

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

/**
 * Lazy loader for the prompt page content (alpha entry point).
 * Returns the inner content without Page/Content wrapper —
 * PageBlueprint provides the page shell.
 */
export const promptPageContentLoader = () =>
  import('./components/PromptPage').then(m => m.PromptPageContent);
