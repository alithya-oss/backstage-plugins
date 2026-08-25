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

import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import { ChatMessage } from '@alithya-oss/backstage-plugin-mcp-chat-common';
// Type-only: importing the service modules for real would close a cycle back
// through `services/QueryProcessor`, which imports this barrel's siblings.
import type { ChatConversationStore } from '../services/ChatConversationStore';
import type { SummarizationService } from '../services/SummarizationService';
import { isGuestUser } from './isGuestUser';
import { isMissingTableError } from './isMissingTableError';

/**
 * Everything {@link saveChatConversation} needs to store a completed run.
 *
 * @public
 */
export interface SaveChatConversationOptions {
  /** The request the run was served from, used to resolve the caller's identity */
  req: express.Request;
  /** The conversation including the assistant's turn */
  conversationMessages: ChatMessage[];
  /** Names of the tools invoked during the run */
  toolsUsed: string[];
  /** ID of the conversation being appended to, or undefined for a new one */
  conversationId?: string;
  conversationStore: ChatConversationStore;
  summarizationService: SummarizationService;
  httpAuth: HttpAuthService;
  logger: LoggerService;
}

/**
 * Stores a completed conversation for an authenticated non-guest user and, for
 * a newly created one, kicks off title generation.
 *
 * Never throws: a persistence failure is logged and reported as "nothing
 * stored", so a run that produced a reply is not failed by a storage problem.
 * Shared by `POST /chat` and `POST /chat/stream` so both persist on identical
 * terms.
 *
 * @returns The stored conversation's ID, or undefined when nothing was stored
 * @public
 */
export async function saveChatConversation(
  options: SaveChatConversationOptions,
): Promise<string | undefined> {
  const {
    req,
    conversationMessages,
    toolsUsed,
    conversationId,
    conversationStore,
    summarizationService,
    httpAuth,
    logger,
  } = options;

  let savedConversationId: string | undefined;
  let userId: string | undefined;
  try {
    const credentials = await httpAuth.credentials(req, {
      allow: ['user'],
      allowLimitedAccess: true,
    });

    userId = credentials.principal.userEntityRef;

    if (!isGuestUser(userId)) {
      const savedConversation = await conversationStore.saveConversation(
        userId,
        conversationMessages,
        toolsUsed.length > 0 ? toolsUsed : undefined,
        conversationId,
      );
      savedConversationId = savedConversation.id;

      // Fire-and-forget: Generate title asynchronously
      // This doesn't block the response to the user
      if (savedConversationId && !conversationId) {
        // Only generate title for new conversations
        const convId = savedConversationId;
        const convUserId = userId;

        setImmediate(async () => {
          try {
            // Generate title using LLM
            const title = await summarizationService.summarizeConversation(
              conversationMessages,
            );

            // Update title in database
            await conversationStore.updateTitle(convUserId, convId, title);

            logger.debug(
              `Generated title for conversation ${convId}: "${title}"`,
            );
          } catch (titleError) {
            logger.warn(
              `Failed to generate title for ${convId}: ${titleError}`,
            );
          }
        });
      }
    }
  } catch (error: any) {
    // Don't fail the request if saving fails
    if (isMissingTableError(error)) {
      logger.warn('Conversations table does not exist yet');
    } else {
      logger.error(`Failed to save conversation: ${error}`);
    }
  }

  return savedConversationId;
}
