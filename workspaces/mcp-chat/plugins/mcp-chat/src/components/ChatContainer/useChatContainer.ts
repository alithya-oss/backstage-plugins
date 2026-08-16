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

import { useEffect, useRef, useState, useCallback } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import { mcpChatApiRef } from '../../api';
import type { ChatMessage as ApiChatMessage } from '../../types';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tools?: string[];
  toolsUsed?: string[];
  toolResponses?: any[];
}

interface UseChatContainerOptions {
  mcpServers: Array<{ id: string; enabled: boolean }>;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  conversationId?: string;
  onConversationUpdated?: (conversationId: string) => void;
}

export interface UseChatContainerResult {
  inputValue: string;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setInputValue: (value: string) => void;
  handleSendMessage: () => Promise<void>;
  handleSuggestionClick: (suggestion: string) => Promise<void>;
  handleKeyPress: (event: React.KeyboardEvent) => void;
  cancelOngoingRequest: () => void;
}

export function useChatContainer(
  options: UseChatContainerOptions,
): UseChatContainerResult {
  const {
    mcpServers,
    messages,
    onMessagesChange,
    conversationId,
    onConversationUpdated,
  } = options;

  const mcpChatApi = useApi(mcpChatApiRef);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const cancelOngoingRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Shared function to send messages to API
  const sendMessageToAPI = useCallback(
    async (messageText: string) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();

      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date(),
      };
      onMessagesChange([...messages, newMessage]);
      setIsTyping(true);

      try {
        // Convert messages to API format including the new message
        const apiMessages: ApiChatMessage[] = [
          ...messages.map(msg => ({
            role: msg.isUser ? ('user' as const) : ('assistant' as const),
            content: msg.text,
          })),
          {
            role: 'user' as const,
            content: messageText,
          },
        ];

        // Get enabled tools from MCP servers
        // Backend uses server IDs to filter tools (tool.serverId matches serverConfig.id)
        const enabledTools = mcpServers
          .filter(server => server.enabled)
          .map(server => server.id);

        const response = await mcpChatApi.sendChatMessage(
          apiMessages,
          enabledTools,
          abortControllerRef.current.signal,
          conversationId,
        );

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        setIsTyping(false);
        abortControllerRef.current = null;

        // Notify parent if conversation was saved
        if (response.conversationId && onConversationUpdated) {
          onConversationUpdated(response.conversationId);
        }

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response.content,
          isUser: false,
          timestamp: new Date(),
          tools: response.toolResponses?.map(tool => tool.toolName) || [],
          toolsUsed: response.toolsUsed || [],
          toolResponses: response.toolResponses || [],
        };
        onMessagesChange([...messages, newMessage, botResponse]);
      } catch (err) {
        // Check if error is due to abortion
        if (err instanceof Error && err.name === 'AbortError') {
          // eslint-disable-next-line no-console
          console.error('Request was cancelled');
          return;
        }

        setIsTyping(false);
        abortControllerRef.current = null;
        // eslint-disable-next-line no-console
        console.error('Failed to send message:', err);

        let errorMessage =
          'Sorry, I encountered an error processing your request.';

        if (err instanceof Error) {
          if (err.message.includes('404')) {
            errorMessage =
              'The MCP Chat service is not available. Please check if the backend is running.';
          } else if (err.message.includes('Network')) {
            errorMessage =
              'Network error. Please check your connection and try again.';
          } else {
            errorMessage = `Error: ${err.message}`;
          }
        }

        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: errorMessage,
          isUser: false,
          timestamp: new Date(),
          tools: [],
          toolsUsed: [],
          toolResponses: [],
        };
        onMessagesChange([...messages, newMessage, errorResponse]);
      }
    },
    [
      mcpChatApi,
      mcpServers,
      messages,
      onMessagesChange,
      conversationId,
      onConversationUpdated,
    ],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => sendMessageToAPI(suggestion),
    [sendMessageToAPI],
  );

  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim()) {
      const messageText = inputValue;
      setInputValue(''); // Clear input immediately
      await sendMessageToAPI(messageText);
    }
  }, [inputValue, sendMessageToAPI]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  return {
    inputValue,
    isTyping,
    messagesEndRef,
    setInputValue,
    handleSendMessage,
    handleSuggestionClick,
    handleKeyPress,
    cancelOngoingRequest,
  };
}
