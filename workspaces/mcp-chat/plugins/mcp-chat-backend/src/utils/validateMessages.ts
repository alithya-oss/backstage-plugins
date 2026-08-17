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
import {
  VALID_ROLES,
  MessageValidationResult,
} from '@alithya-oss/backstage-plugin-mcp-chat-common';

/**
 * Validates the structure and content of chat messages.
 * Checks for required fields, valid roles, and proper message format.
 *
 * @param messages - Array of messages to validate
 * @param logger - The logger service for diagnostic output
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateMessages([
 *   { role: 'user', content: 'Hello' }
 * ], logger);
 * if (!result.isValid) {
 *   throw new Error(result.error);
 * }
 * ```
 *
 * @public
 */
export const validateMessages = (
  messages: unknown,
  logger: LoggerService,
): MessageValidationResult => {
  // Check if messages exists and is an array
  if (!messages) {
    return { isValid: false, error: 'Messages field is required' };
  }

  if (!Array.isArray(messages)) {
    return { isValid: false, error: 'Messages must be an array' };
  }

  if (messages.length === 0) {
    return { isValid: false, error: 'At least one message is required' };
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check if message is an object
    if (!message || typeof message !== 'object') {
      return {
        isValid: false,
        error: `Message at index ${i} must be an object`,
      };
    }

    // Check required fields
    if (!message.hasOwnProperty('role')) {
      return {
        isValid: false,
        error: `Message at index ${i} is missing required field 'role'`,
      };
    }

    if (!message.hasOwnProperty('content')) {
      return {
        isValid: false,
        error: `Message at index ${i} is missing required field 'content'`,
      };
    }

    // Validate role
    if (!VALID_ROLES.includes(message.role)) {
      return {
        isValid: false,
        error: `Message at index ${i} has invalid role '${
          message.role
        }'. Valid roles are: ${VALID_ROLES.join(', ')}`,
      };
    }

    // Validate content
    if (message.content !== null && typeof message.content !== 'string') {
      return {
        isValid: false,
        error: `Message at index ${i} content must be a string or null`,
      };
    }

    // Check for empty or whitespace-only content
    if (
      message.content === null ||
      (typeof message.content === 'string' && message.content.trim() === '')
    ) {
      // For tool messages, empty content might be acceptable
      if (message.role !== 'tool') {
        return {
          isValid: false,
          error: `Message at index ${i} has empty content`,
        };
      }
    }

    // Validate content length (prevent extremely large messages)
    if (
      typeof message.content === 'string' &&
      message.content.length > 100000
    ) {
      return {
        isValid: false,
        error: `Message at index ${i} content exceeds maximum length of 100,000 characters`,
      };
    }

    // Validate tool-specific fields
    if (message.role === 'tool') {
      if (!message.tool_call_id || typeof message.tool_call_id !== 'string') {
        return {
          isValid: false,
          error: `Tool message at index ${i} must have a valid tool_call_id`,
        };
      }
    }

    // Validate tool_calls if present
    if (message.tool_calls !== undefined) {
      if (!Array.isArray(message.tool_calls)) {
        return {
          isValid: false,
          error: `Message at index ${i} tool_calls must be an array`,
        };
      }

      for (let j = 0; j < message.tool_calls.length; j++) {
        const toolCall = message.tool_calls[j];
        if (!toolCall || typeof toolCall !== 'object') {
          return {
            isValid: false,
            error: `Tool call at index ${j} in message ${i} must be an object`,
          };
        }

        // Basic tool call structure validation
        if (!toolCall.id || typeof toolCall.id !== 'string') {
          return {
            isValid: false,
            error: `Tool call at index ${j} in message ${i} must have a valid id`,
          };
        }

        if (!toolCall.function || typeof toolCall.function !== 'object') {
          return {
            isValid: false,
            error: `Tool call at index ${j} in message ${i} must have a valid function object`,
          };
        }

        if (
          !toolCall.function.name ||
          typeof toolCall.function.name !== 'string'
        ) {
          return {
            isValid: false,
            error: `Tool call at index ${j} in message ${i} must have a valid function name`,
          };
        }
      }
    }
  }

  // Validate conversation flow
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return { isValid: false, error: 'Last message must be from user' };
  }

  // Check for alternating pattern (optional but recommended)
  let hasConsecutiveUserMessages = false;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].role === 'user' && messages[i - 1].role === 'user') {
      hasConsecutiveUserMessages = true;
      break;
    }
  }

  // Allow consecutive user messages but log a warning
  if (hasConsecutiveUserMessages) {
    logger.warn('Consecutive user messages detected in conversation');
  }

  return { isValid: true };
};
