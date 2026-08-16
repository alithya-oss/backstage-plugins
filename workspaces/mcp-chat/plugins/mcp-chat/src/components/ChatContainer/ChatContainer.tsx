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

import { useImperativeHandle, forwardRef } from 'react';
import { useChatContainer } from './useChatContainer';
import { ChatContainerView } from './ChatContainerView';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tools?: string[];
  toolsUsed?: string[];
  toolResponses?: any[];
}

export interface ChatContainerMCPServer {
  id: string;
  name: string;
  enabled: boolean;
}

interface ChatContainerProps {
  sidebarCollapsed: boolean;
  mcpServers: ChatContainerMCPServer[];
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  conversationId?: string;
  onConversationUpdated?: (conversationId: string) => void;
}

export interface ChatContainerRef {
  cancelOngoingRequest: () => void;
}

export const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(
  (
    {
      sidebarCollapsed,
      mcpServers,
      messages,
      onMessagesChange,
      conversationId,
      onConversationUpdated,
    },
    ref,
  ) => {
    const {
      inputValue,
      isTyping,
      messagesEndRef,
      setInputValue,
      handleSendMessage,
      handleSuggestionClick,
      handleKeyPress,
      cancelOngoingRequest,
    } = useChatContainer({
      mcpServers,
      messages,
      onMessagesChange,
      conversationId,
      onConversationUpdated,
    });

    // Expose the cancel function through ref
    useImperativeHandle(
      ref,
      () => ({
        cancelOngoingRequest,
      }),
      [cancelOngoingRequest],
    );

    return (
      <ChatContainerView
        sidebarCollapsed={sidebarCollapsed}
        messages={messages}
        inputValue={inputValue}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        onSuggestionClick={handleSuggestionClick}
        onKeyPress={handleKeyPress}
      />
    );
  },
);
