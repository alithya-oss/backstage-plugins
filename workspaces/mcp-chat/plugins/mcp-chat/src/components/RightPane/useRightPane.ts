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

import { useState } from 'react';
import { useAvailableTools } from '../../hooks';
import { MCPServer, Tool } from '../../types';

export type TabType = 'status' | 'history';

export interface UseRightPaneOptions {
  mcpServers: MCPServer[];
  onToggleSidebar: () => void;
}

export interface UseRightPaneReturn {
  activeTab: TabType;
  availableTools: Tool[];
  toolsLoading: boolean;
  handleTabChange: (
    event: React.MouseEvent<HTMLElement>,
    newTab: TabType | null,
  ) => void;
  expandToHistory: () => void;
  expandToStatus: () => void;
}

export function useRightPane(options: UseRightPaneOptions): UseRightPaneReturn {
  const { mcpServers, onToggleSidebar } = options;
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const { availableTools, isLoading: toolsLoading } =
    useAvailableTools(mcpServers);

  const handleTabChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTab: TabType | null,
  ) => {
    if (newTab !== null) {
      setActiveTab(newTab);
    }
  };

  const expandToHistory = () => {
    onToggleSidebar();
    setActiveTab('history');
  };

  const expandToStatus = () => {
    onToggleSidebar();
    setActiveTab('status');
  };

  return {
    activeTab,
    availableTools,
    toolsLoading,
    handleTabChange,
    expandToHistory,
    expandToStatus,
  };
}
