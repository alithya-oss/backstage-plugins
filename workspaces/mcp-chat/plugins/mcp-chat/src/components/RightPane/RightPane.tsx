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

import { FC } from 'react';
import { MCPServer, ConversationRecord } from '../../types';
import { UseProviderStatusReturn } from '../../hooks';
import { useRightPane } from './useRightPane';
import { RightPaneView } from './RightPaneView';

interface RightPaneProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  mcpServers: MCPServer[];
  onServerToggle: (serverName: string) => void;
  providerStatus: UseProviderStatusReturn;
  // Conversation history props
  starredConversations: ConversationRecord[];
  recentConversations: ConversationRecord[];
  conversationsLoading: boolean;
  conversationsError?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  onSelectConversation: (conversation: ConversationRecord) => void;
  onToggleStar: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  selectedConversationId?: string;
}

export const RightPane: FC<RightPaneProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onNewChat,
  mcpServers,
  onServerToggle,
  providerStatus,
  starredConversations,
  recentConversations,
  conversationsLoading,
  conversationsError,
  searchQuery,
  onSearchChange,
  onSearchClear,
  onSelectConversation,
  onToggleStar,
  onDeleteConversation,
  selectedConversationId,
}) => {
  const {
    activeTab,
    availableTools,
    toolsLoading,
    handleTabChange,
    expandToHistory,
    expandToStatus,
  } = useRightPane({ mcpServers, onToggleSidebar });

  return (
    <RightPaneView
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={onToggleSidebar}
      onNewChat={onNewChat}
      mcpServers={mcpServers}
      onServerToggle={onServerToggle}
      providerStatus={providerStatus}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      availableTools={availableTools}
      toolsLoading={toolsLoading}
      expandToHistory={expandToHistory}
      expandToStatus={expandToStatus}
      starredConversations={starredConversations}
      recentConversations={recentConversations}
      conversationsLoading={conversationsLoading}
      conversationsError={conversationsError}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onSearchClear={onSearchClear}
      onSelectConversation={onSelectConversation}
      onToggleStar={onToggleStar}
      onDeleteConversation={onDeleteConversation}
      selectedConversationId={selectedConversationId}
    />
  );
};
