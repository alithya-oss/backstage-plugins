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

import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { validate as uuidValidate } from 'uuid';
import { ChatMessage } from '@alithya-oss/backstage-plugin-mcp-chat-common';
import { validateMessages } from './validateMessages';

/**
 * A chat request body accepted by both the single-response and the streaming
 * chat endpoints.
 *
 * @public
 */
export interface ValidatedChatRequest {
  /** The prior conversation, ending with the user's turn */
  messages: ChatMessage[];
  /** IDs of the MCP servers whose tools may be used, or undefined for all */
  enabledTools?: string[];
  /** ID of the conversation to append to, or undefined for a new one */
  conversationId?: string;
}

/**
 * Validates a chat request body, throwing {@link @backstage/errors#InputError}
 * on the first problem found.
 *
 * Shared by `POST /chat` and `POST /chat/stream` so a payload one endpoint
 * rejects is rejected identically by the other — and, for the streaming
 * endpoint, before any event stream is opened.
 *
 * @param body - The raw request body
 * @param logger - The logger service for diagnostic output
 * @returns The validated request fields
 * @public
 */
export function validateChatRequest(
  body: any,
  logger: LoggerService,
): ValidatedChatRequest {
  const { messages, enabledTools, conversationId } = body ?? {};

  // Validate conversationId format if provided
  if (conversationId && !uuidValidate(conversationId)) {
    throw new InputError('Invalid conversation ID format');
  }

  const validation = validateMessages(messages, logger);
  if (!validation.isValid) {
    logger.warn(`Message validation failed: ${validation.error}`);
    throw new InputError(validation.error!);
  }

  if (enabledTools && !Array.isArray(enabledTools)) {
    throw new InputError('enabledTools must be an array');
  }

  if (
    enabledTools &&
    enabledTools.some((tool: any) => typeof tool !== 'string')
  ) {
    throw new InputError('All enabledTools must be strings');
  }

  return { messages, enabledTools, conversationId };
}
