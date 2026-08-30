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

import { useCallback, useMemo, useState } from 'react';
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import {
  useConversations,
  useMcpServers,
  useProviderStatus,
} from '../../hooks';
import { usePromptThread, toPromptTurns } from './usePromptThread';
import { PromptThread } from './PromptThread';
import { SidePanel } from './SidePanel';
import styles from './PromptPageContent.module.css';

/**
 * Inner prompt page content without the Page/Content shell — PageBlueprint
 * provides the page shell.
 *
 * The conversation state lives in `usePromptThread` and reaches the runtime
 * through its `ExternalStoreAdapter`, so React state stays the single source of
 * truth: selecting a stored conversation replaces the list without the runtime
 * having to import a message repository.
 *
 * The page owns the side panel's state too, because it is the same state a run
 * reads: the enabled server ids go into the next request, and a selected
 * conversation replaces both the turn list and the id subsequent runs continue.
 * It is also why the page, not the thread hook, is what re-reads the stored list
 * once a run has persisted a conversation.
 *
 * The run failure is the one piece of state the surface receives as a prop
 * rather than reading from the runtime: it is the page's, not a message's, which
 * is what keeps a failure from being rendered as assistant content.
 */
export const PromptPageContent = () => {
  const {
    mcpServers,
    isLoading: serversLoading,
    error: serversError,
    refetch: refetchServers,
    handleServerToggle,
  } = useMcpServers();
  const {
    providerStatusData,
    isLoading: providerLoading,
    error: providerError,
  } = useProviderStatus();
  const {
    starredConversations,
    recentConversations,
    loading: conversationsLoading,
    searchQuery,
    setSearchQuery,
    loadConversation,
    refreshConversations,
    deleteConversation,
    toggleStar,
  } = useConversations();

  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // Only enabled servers' ids travel with a run, which is what withholds a
  // disabled server's tools from the provider.
  const enabledServerIds = useMemo(
    () => mcpServers.filter(server => server.enabled).map(server => server.id),
    [mcpServers],
  );

  const { adapter, conversationId, error, retry, setConversation } =
    usePromptThread({
      enabledServerIds,
      isLoading: isLoadingConversation,
      // A completed run has changed the stored list — a new conversation, or a
      // new update time on the one being continued — so the list is re-read
      // rather than left as it was when the page loaded.
      onConversationPersisted: refreshConversations,
    });
  const runtime = useExternalStoreRuntime(adapter);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setIsLoadingConversation(true);
      try {
        const record = await loadConversation(id);
        // Pushing the stored id alongside the turns is what makes the next
        // prompt continue this conversation instead of starting another.
        setConversation(toPromptTurns(record.messages), record.id);
      } finally {
        setIsLoadingConversation(false);
      }
    },
    [loadConversation, setConversation],
  );

  const handleNewConversation = useCallback(() => {
    setConversation([], undefined);
  }, [setConversation]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className={styles.root}>
        <h1 className={styles.heading}>MCP Prompt</h1>
        <div className={styles.body}>
          <PromptThread error={error} onRetry={retry} />
          <SidePanel
            servers={{
              servers: mcpServers,
              isLoading: serversLoading,
              error: serversError,
              onToggle: handleServerToggle,
              onRetry: refetchServers,
            }}
            provider={{
              providerStatusData,
              isLoading: providerLoading,
              error: providerError,
            }}
            conversations={{
              starred: starredConversations,
              recent: recentConversations,
              loading: conversationsLoading,
              searchQuery,
              onSearchChange: setSearchQuery,
              selectedId: conversationId,
              onSelect: handleSelectConversation,
              onToggleStar: toggleStar,
              onDelete: deleteConversation,
              onNewConversation: handleNewConversation,
            }}
          />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
