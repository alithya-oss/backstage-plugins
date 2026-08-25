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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '@backstage/frontend-plugin-api';
import type { AppendMessage, ExternalStoreAdapter } from '@assistant-ui/react';
import { mcpChatApiRef } from '../../api';
import type { ChatMessage } from '../../types';
import { convertMessage } from './convertMessage';
import type {
  PromptThreadError,
  PromptTurn,
  PromptToolInvocation,
} from './promptThreadTypes';

/**
 * Reads the text a composer submitted. Only `text` parts carry a prompt; other
 * part types are dropped rather than stringified.
 */
function textOf(content: AppendMessage['content']): string {
  return content.map(part => (part.type === 'text' ? part.text : '')).join('');
}

/**
 * Builds conversation state from a stored conversation's messages.
 *
 * Exposed so the side panel can hand a selected conversation to
 * {@link UsePromptThreadResult.setConversation} without inventing its own turn
 * ids.
 */
export function toPromptTurns(messages: ChatMessage[]): PromptTurn[] {
  return messages.map((message, index) => ({
    id: `stored-${index}`,
    role: message.role,
    text: message.content,
    ...(message.role === 'assistant'
      ? { status: { type: 'complete' as const } }
      : {}),
  }));
}

/**
 * Options of {@link usePromptThread}.
 */
export interface UsePromptThreadOptions {
  /**
   * IDs of the MCP servers currently enabled. Read at the moment a run starts,
   * so a toggle takes effect on the next run without restarting this one.
   */
  enabledServerIds?: string[];
  /** Whether a stored conversation is being fetched. */
  isLoading?: boolean;
}

/**
 * State layer of the prompt page.
 */
export interface UsePromptThreadResult {
  /** The adapter to hand to `useExternalStoreRuntime`. */
  adapter: ExternalStoreAdapter<PromptTurn>;
  /** The conversation, as the page's own view model. */
  turns: PromptTurn[];
  /** ID of the conversation the backend persisted, once it reported one. */
  conversationId: string | undefined;
  /** Whether a run is in flight. */
  isRunning: boolean;
  /** The failure of the last run, until the next run starts. */
  error: PromptThreadError | undefined;
  /** Re-runs the last user turn, replacing a failed assistant turn. */
  retry: () => Promise<void>;
  /** Replaces the conversation with a stored one. */
  setConversation: (turns: PromptTurn[], conversationId?: string) => void;
  /** Clears the conversation and the active conversation id. */
  startNewConversation: () => void;
}

/**
 * Holds the prompt page's conversation: the turn list, the active
 * `conversationId`, the in-flight `AbortController` and the running flag, and
 * assembles the `ExternalStoreAdapter` over them.
 *
 * The turn list is mirrored in a ref because a run applies stream events from
 * an async loop: reading the ref keeps every event applied to the list as it
 * stands, not to the list a stale closure captured.
 */
export function usePromptThread(
  options: UsePromptThreadOptions = {},
): UsePromptThreadResult {
  const { enabledServerIds = [], isLoading = false } = options;
  const mcpChatApi = useApi(mcpChatApiRef);

  const [turns, setTurnsState] = useState<PromptTurn[]>([]);
  const [conversationId, setConversationIdState] = useState<
    string | undefined
  >();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<PromptThreadError | undefined>();

  const turnsRef = useRef<PromptTurn[]>([]);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const runRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);
  const enabledServerIdsRef = useRef<string[]>(enabledServerIds);
  enabledServerIdsRef.current = enabledServerIds;

  const nextId = useCallback(() => {
    idRef.current += 1;
    return `turn-${idRef.current}`;
  }, []);

  const commit = useCallback((next: PromptTurn[]) => {
    turnsRef.current = next;
    setTurnsState(next);
  }, []);

  const patchTurn = useCallback(
    (id: string, patch: (turn: PromptTurn) => PromptTurn) => {
      commit(
        turnsRef.current.map(turn => (turn.id === id ? patch(turn) : turn)),
      );
    },
    [commit],
  );

  // Abort an in-flight run when the page goes away, so a closed page does not
  // keep a provider request alive.
  useEffect(
    () => () => {
      runRef.current?.abort();
      runRef.current = null;
    },
    [],
  );

  const runStream = useCallback(
    async (history: PromptTurn[]) => {
      const controller = new AbortController();
      runRef.current = controller;
      setIsRunning(true);
      setError(undefined);

      const assistantId = nextId();
      commit([
        ...history,
        {
          id: assistantId,
          role: 'assistant',
          text: '',
          invocations: [],
          status: { type: 'running' },
        },
      ]);

      const payload: ChatMessage[] = history
        .filter(turn => turn.text.length > 0)
        .map(turn => ({ role: turn.role, content: turn.text }));

      let terminated = false;
      try {
        for await (const event of mcpChatApi.streamChatMessage(
          payload,
          enabledServerIdsRef.current,
          controller.signal,
          conversationIdRef.current,
        )) {
          switch (event.type) {
            case 'text':
              patchTurn(assistantId, turn => ({
                ...turn,
                text: turn.text + event.text,
              }));
              break;
            case 'tool-call': {
              const invocation: PromptToolInvocation = {
                id: event.id,
                name: event.name,
                arguments: event.arguments,
                serverId: event.serverId,
              };
              patchTurn(assistantId, turn => ({
                ...turn,
                invocations: [...(turn.invocations ?? []), invocation],
              }));
              break;
            }
            case 'tool-result':
              // Filled in place, keyed by id, so a resolving invocation never
              // appears twice.
              patchTurn(assistantId, turn => ({
                ...turn,
                invocations: (turn.invocations ?? []).map(invocation =>
                  invocation.id === event.id
                    ? {
                        ...invocation,
                        result: event.result,
                        isError: event.isError,
                      }
                    : invocation,
                ),
              }));
              break;
            case 'complete':
              terminated = true;
              if (event.conversationId) {
                conversationIdRef.current = event.conversationId;
                setConversationIdState(event.conversationId);
              }
              patchTurn(assistantId, turn => ({
                ...turn,
                status: { type: 'complete' },
              }));
              break;
            case 'error':
              // The failure is state, not assistant content: whatever text had
              // arrived stays and the turn is marked interrupted.
              terminated = true;
              patchTurn(assistantId, turn => ({
                ...turn,
                status: { type: 'error', message: event.message },
              }));
              setError({ kind: 'provider', message: event.message });
              break;
            default:
              break;
          }
        }

        if (!terminated && !controller.signal.aborted) {
          const message = 'The chat run ended before it completed.';
          patchTurn(assistantId, turn => ({
            ...turn,
            status: { type: 'error', message },
          }));
          setError({ kind: 'provider', message });
        }
      } catch (caught) {
        if (controller.signal.aborted) {
          // A cancelled run's state belongs to onCancel.
          return;
        }
        const detail =
          caught instanceof Error ? caught.message : String(caught);
        const message = `The chat service is unavailable: ${detail}`;
        patchTurn(assistantId, turn => ({
          ...turn,
          status: { type: 'error', message },
        }));
        setError({ kind: 'transport', message });
      } finally {
        if (runRef.current === controller) {
          runRef.current = null;
          setIsRunning(false);
        }
      }
    },
    [mcpChatApi, commit, patchTurn, nextId],
  );

  const setMessages = useCallback(
    (next: readonly PromptTurn[]) => {
      commit([...next]);
    },
    [commit],
  );

  const onNew = useCallback(
    async (message: AppendMessage) => {
      const text = textOf(message.content).trim();
      // A blank prompt appends nothing and starts nothing.
      if (!text) {
        return;
      }
      // One run at a time per conversation: a submit during a run is dropped
      // rather than interleaved with it.
      if (runRef.current) {
        return;
      }
      await runStream([
        ...turnsRef.current,
        { id: nextId(), role: 'user', text },
      ]);
    },
    [runStream, nextId],
  );

  const onEdit = useCallback(
    async (message: AppendMessage) => {
      const text = textOf(message.content).trim();
      if (!text || runRef.current) {
        return;
      }
      const index = message.sourceId
        ? turnsRef.current.findIndex(turn => turn.id === message.sourceId)
        : -1;
      const history =
        index === -1 ? [...turnsRef.current] : turnsRef.current.slice(0, index);
      await runStream([...history, { id: nextId(), role: 'user', text }]);
    },
    [runStream, nextId],
  );

  const onReload = useCallback(
    async (parentId: string | null) => {
      if (runRef.current) {
        return;
      }
      const index =
        parentId === null
          ? -1
          : turnsRef.current.findIndex(turn => turn.id === parentId);
      const history = index === -1 ? [] : turnsRef.current.slice(0, index + 1);
      // Nothing to regenerate without a prompt to regenerate from.
      if (!history.some(turn => turn.role === 'user')) {
        return;
      }
      await runStream(history);
    },
    [runStream],
  );

  const onCancel = useCallback(async () => {
    const controller = runRef.current;
    if (!controller) {
      return;
    }
    controller.abort();
    runRef.current = null;
    setIsRunning(false);

    const cancelledIds = new Set(
      turnsRef.current
        .filter(turn => turn.status?.type === 'running')
        .map(turn => turn.id),
    );

    // Mark the interrupted turn cancelled first — no turn is ever left marked
    // running — then hand the trimmed list back through setMessages, which is
    // what makes the removal survive the runtime's next snapshot.
    const marked = turnsRef.current.map(turn =>
      cancelledIds.has(turn.id)
        ? { ...turn, status: { type: 'cancelled' as const } }
        : turn,
    );
    commit(marked);
    setMessages(marked.filter(turn => !cancelledIds.has(turn.id)));
  }, [commit, setMessages]);

  const retry = useCallback(async () => {
    if (runRef.current) {
      return;
    }
    const current = turnsRef.current;
    const lastUser = current.reduce(
      (found, turn, index) => (turn.role === 'user' ? index : found),
      -1,
    );
    if (lastUser === -1) {
      return;
    }
    // Re-running from the last user turn drops the failed assistant turn, so
    // the error is replaced by the new turn rather than sitting beside it.
    await runStream(current.slice(0, lastUser + 1));
  }, [runStream]);

  const setConversation = useCallback(
    (nextTurns: PromptTurn[], nextConversationId?: string) => {
      runRef.current?.abort();
      runRef.current = null;
      setIsRunning(false);
      setError(undefined);
      conversationIdRef.current = nextConversationId;
      setConversationIdState(nextConversationId);
      commit(nextTurns);
    },
    [commit],
  );

  const startNewConversation = useCallback(() => {
    setConversation([], undefined);
  }, [setConversation]);

  // Exactly the handler set design.md fixes: no onAddToolResult, no
  // adapters.threadList, and unstable_enableToolInvocations left at its false
  // default because every MCP tool runs server-side.
  const adapter = useMemo<ExternalStoreAdapter<PromptTurn>>(
    () => ({
      messages: turns,
      convertMessage,
      isRunning,
      isLoading,
      onNew,
      setMessages,
      onEdit,
      onReload,
      onCancel,
    }),
    [
      turns,
      isRunning,
      isLoading,
      onNew,
      setMessages,
      onEdit,
      onReload,
      onCancel,
    ],
  );

  return {
    adapter,
    turns,
    conversationId,
    isRunning,
    error,
    retry,
    setConversation,
    startNewConversation,
  };
}
