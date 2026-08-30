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
import {
  ExportedMessageRepository,
  type AppendMessage,
  type ExternalStoreAdapter,
  type ThreadMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react';
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
 * How a run relates to the answers already on screen.
 *
 * `restart` drops whatever answers the tail held — the prompt itself changed, so
 * the old answers are no longer alternatives to the same question. `alternative`
 * keeps them and adds one more, which is what makes regenerating
 * non-destructive.
 */
type RunMode = 'restart' | 'alternative';

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
  /**
   * Called once a run reports the conversation the backend stored, whether it
   * created that conversation or appended to it — both change what a stored
   * conversation list should show. Not called for a run that failed or was
   * cancelled, since neither persists anything.
   */
  onConversationPersisted?: (conversationId: string) => void;
}

/**
 * State layer of the prompt page.
 */
export interface UsePromptThreadResult {
  /** The adapter to hand to `useExternalStoreRuntime`. */
  adapter: ExternalStoreAdapter<ThreadMessage>;
  /** The conversation as currently shown: the path plus the selected answer. */
  turns: PromptTurn[];
  /**
   * The alternative versions of the last answer, oldest first. A single element
   * means regenerating has not happened since the tail last moved.
   */
  tailVersions: PromptTurn[];
  /** Which of {@link tailVersions} is shown. */
  tailIndex: number;
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
 * The conversation is held as a linear `path` plus the versions of its last
 * answer. There is exactly one branch point and it never moves: the last user
 * turn. That is what keeps regenerating non-destructive without introducing a
 * general tree — and it is why nothing about persistence changes, since the
 * selected version is the one a later run sends and the backend stores.
 *
 * Both are mirrored in refs because a run applies stream events from an async
 * loop: reading the ref keeps every event applied to the state as it stands, not
 * to the state a stale closure captured.
 */
export function usePromptThread(
  options: UsePromptThreadOptions = {},
): UsePromptThreadResult {
  const {
    enabledServerIds = [],
    isLoading = false,
    onConversationPersisted,
  } = options;
  const mcpChatApi = useApi(mcpChatApiRef);

  // The conversation up to, and excluding, the answer that carries versions.
  const [path, setPathState] = useState<PromptTurn[]>([]);
  // Versions of the last answer, oldest first. Empty when the conversation has
  // no branchable tail — a fresh page, or one just loaded from storage.
  const [tailVersions, setTailVersionsState] = useState<PromptTurn[]>([]);
  const [tailIndex, setTailIndexState] = useState(0);
  const [conversationId, setConversationIdState] = useState<
    string | undefined
  >();
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<PromptThreadError | undefined>();

  const pathRef = useRef<PromptTurn[]>([]);
  const tailVersionsRef = useRef<PromptTurn[]>([]);
  const tailIndexRef = useRef(0);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const runRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);
  const enabledServerIdsRef = useRef<string[]>(enabledServerIds);
  enabledServerIdsRef.current = enabledServerIds;
  // Held in a ref for the same reason as the enabled ids: a run applies its
  // events from an async loop, so it must reach the callback as it stands now
  // rather than the one its starting render captured.
  const onConversationPersistedRef = useRef(onConversationPersisted);
  onConversationPersistedRef.current = onConversationPersisted;

  const nextId = useCallback(() => {
    idRef.current += 1;
    return `turn-${idRef.current}`;
  }, []);

  const commit = useCallback(
    (nextPath: PromptTurn[], versions: PromptTurn[], index: number) => {
      pathRef.current = nextPath;
      tailVersionsRef.current = versions;
      tailIndexRef.current = index;
      setPathState(nextPath);
      setTailVersionsState(versions);
      setTailIndexState(index);
    },
    [],
  );

  /** The conversation as shown: the path followed by the selected answer. */
  const currentTurns = useCallback(
    () =>
      tailVersionsRef.current.length > 0
        ? [
            ...pathRef.current,
            tailVersionsRef.current[tailIndexRef.current] as PromptTurn,
          ]
        : pathRef.current,
    [],
  );

  /**
   * Patches the version being streamed. Only the tail ever changes mid-run, so
   * the patch is confined to the version list.
   */
  const patchTail = useCallback(
    (id: string, patch: (turn: PromptTurn) => PromptTurn) => {
      commit(
        pathRef.current,
        tailVersionsRef.current.map(turn =>
          turn.id === id ? patch(turn) : turn,
        ),
        tailIndexRef.current,
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
    async (nextPath: PromptTurn[], mode: RunMode) => {
      const controller = new AbortController();
      runRef.current = controller;
      setIsRunning(true);
      setError(undefined);

      const assistantId = nextId();
      const assistantTurn: PromptTurn = {
        id: assistantId,
        role: 'assistant',
        text: '',
        invocations: [],
        status: { type: 'running' },
      };
      const versions =
        mode === 'alternative'
          ? [...tailVersionsRef.current, assistantTurn]
          : [assistantTurn];
      commit(nextPath, versions, versions.length - 1);

      const payload: ChatMessage[] = nextPath
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
              patchTail(assistantId, turn => ({
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
              patchTail(assistantId, turn => ({
                ...turn,
                invocations: [...(turn.invocations ?? []), invocation],
              }));
              break;
            }
            case 'tool-result':
              // Filled in place, keyed by id, so a resolving invocation never
              // appears twice.
              patchTail(assistantId, turn => ({
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
                // The stored list is now behind: this run either added a
                // conversation to it or changed the update time and title of one
                // already there. Reporting the id lets the owner of that list
                // re-read it; the id is unchanged when the run continued a
                // conversation, which is why the report is not conditional on
                // it having changed.
                onConversationPersistedRef.current?.(event.conversationId);
              }
              patchTail(assistantId, turn => ({
                ...turn,
                status: { type: 'complete' },
              }));
              break;
            case 'error':
              // The failure is state, not assistant content: whatever text had
              // arrived stays and the turn is marked interrupted.
              terminated = true;
              patchTail(assistantId, turn => ({
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
          patchTail(assistantId, turn => ({
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
        patchTail(assistantId, turn => ({
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
    [mcpChatApi, commit, patchTail, nextId],
  );

  /**
   * Applies a message list the runtime rewrote.
   *
   * The runtime hands back `ThreadMessage`s, so only their ids are meaningful
   * here — the content is ours already. Two rewrites reach this: a branch
   * switch, where the path is unchanged and the trailing id names the version to
   * show, and a removal, where the path itself shrank. An id we no longer hold
   * is dropped rather than resurrected, which is what keeps the runtime's
   * post-cancel resync from putting an abandoned turn back.
   */
  const setMessages = useCallback(
    (next: readonly ThreadMessage[]) => {
      const known = new Map<string, PromptTurn>();
      for (const turn of pathRef.current) {
        known.set(turn.id, turn);
      }
      for (const version of tailVersionsRef.current) {
        known.set(version.id, version);
      }

      const resolved = next
        .map(message => known.get(message.id))
        .filter((turn): turn is PromptTurn => turn !== undefined);

      const last = resolved[resolved.length - 1];
      const switchedTo = last
        ? tailVersionsRef.current.findIndex(version => version.id === last.id)
        : -1;

      if (switchedTo !== -1 && resolved.length === pathRef.current.length + 1) {
        // A branch switch: same path, another version selected.
        commit(pathRef.current, tailVersionsRef.current, switchedTo);
        return;
      }

      // A rewritten path. The version the runtime kept, if any, stays as the
      // only one: alternatives belong to a tail that no longer exists.
      const keptVersion = switchedTo === -1 ? undefined : last;
      commit(
        keptVersion ? resolved.slice(0, -1) : resolved,
        keptVersion ? [keptVersion] : [],
        0,
      );
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
      // The tail advances, taking the selected version with it: the earlier
      // alternatives are abandoned here, which is what keeps the model bounded
      // and the stored conversation linear.
      await runStream(
        [...currentTurns(), { id: nextId(), role: 'user', text }],
        'restart',
      );
    },
    [runStream, nextId, currentTurns],
  );

  const onEdit = useCallback(
    async (message: AppendMessage) => {
      const text = textOf(message.content).trim();
      if (!text || runRef.current) {
        return;
      }
      const turns = currentTurns();
      const index = message.sourceId
        ? turns.findIndex(turn => turn.id === message.sourceId)
        : -1;
      // Editing truncates: the prompt changed, so everything that followed it
      // answered a different question. The page warns before this applies.
      const history = index === -1 ? [...turns] : turns.slice(0, index);
      await runStream(
        [...history, { id: nextId(), role: 'user', text }],
        'restart',
      );
    },
    [runStream, nextId, currentTurns],
  );

  const onReload = useCallback(
    async (parentId: string | null) => {
      if (runRef.current) {
        return;
      }
      const turns = currentTurns();
      const index =
        parentId === null ? -1 : turns.findIndex(turn => turn.id === parentId);
      const history = index === -1 ? [] : turns.slice(0, index + 1);
      // Nothing to regenerate without a prompt to regenerate from.
      if (!history.some(turn => turn.role === 'user')) {
        return;
      }
      const lastUserIndex = turns.reduce(
        (found, turn, at) => (turn.role === 'user' ? at : found),
        -1,
      );
      if (index !== lastUserIndex) {
        // Regenerating an older turn is a truncation, like an edit: the branch
        // point is only ever the last user turn.
        await runStream(history, 'restart');
        return;
      }
      // The answer already on screen is kept as a version. A conversation just
      // loaded from storage has no version list yet, so its stored answer
      // becomes the first one.
      if (tailVersionsRef.current.length === 0) {
        commit(history, turns.slice(index + 1), 0);
      }
      await runStream(history, 'alternative');
    },
    [runStream, currentTurns, commit],
  );

  const onCancel = useCallback(async () => {
    const controller = runRef.current;
    if (!controller) {
      return;
    }
    controller.abort();
    runRef.current = null;
    setIsRunning(false);

    // Drop the interrupted version rather than leaving it marked running, and
    // leave the versions that preceded it alone: cancelling a regeneration
    // falls back to the answer that was already there.
    const remaining = tailVersionsRef.current.filter(
      version => version.status?.type !== 'running',
    );
    commit(
      pathRef.current,
      remaining,
      Math.max(0, Math.min(tailIndexRef.current, remaining.length - 1)),
    );
  }, [commit]);

  const retry = useCallback(async () => {
    if (runRef.current) {
      return;
    }
    const turns = currentTurns();
    const lastUser = turns.reduce(
      (found, turn, index) => (turn.role === 'user' ? index : found),
      -1,
    );
    if (lastUser === -1) {
      return;
    }
    // Re-running from the last user turn drops the failed assistant turn, so
    // the error is replaced by the new turn rather than sitting beside it.
    await runStream(turns.slice(0, lastUser + 1), 'restart');
  }, [runStream, currentTurns]);

  const setConversation = useCallback(
    (nextTurns: PromptTurn[], nextConversationId?: string) => {
      runRef.current?.abort();
      runRef.current = null;
      setIsRunning(false);
      setError(undefined);
      conversationIdRef.current = nextConversationId;
      setConversationIdState(nextConversationId);
      // A stored conversation is linear by construction: no versions, so the
      // branch picker has nothing to show.
      commit(nextTurns, [], 0);
    },
    [commit],
  );

  const startNewConversation = useCallback(() => {
    setConversation([], undefined);
  }, [setConversation]);

  const turns = useMemo(
    () =>
      tailVersions.length > 0
        ? [...path, tailVersions[tailIndex] as PromptTurn]
        : path,
    [path, tailVersions, tailIndex],
  );

  /**
   * The conversation as the runtime reads it.
   *
   * Every version shares the last user turn as its parent, which is what makes
   * them siblings the branch picker can walk, and `headId` names the one on
   * screen. A repository is passed rather than a flat message list because a
   * flat list cannot express two answers to the same prompt.
   */
  const messageRepository = useMemo(() => {
    const items: { message: ThreadMessageLike; parentId: string | null }[] = [];
    let parentId: string | null = null;
    for (const turn of path) {
      items.push({ message: convertMessage(turn), parentId });
      parentId = turn.id;
    }
    for (const version of tailVersions) {
      items.push({ message: convertMessage(version), parentId });
    }
    const head = tailVersions[tailIndex] ?? path[path.length - 1];
    return ExportedMessageRepository.fromBranchableArray(items, {
      headId: head?.id ?? null,
    });
  }, [path, tailVersions, tailIndex]);

  // Exactly the handler set design.md fixes: no onAddToolResult, no
  // adapters.threadList, and unstable_enableToolInvocations left at its false
  // default because every MCP tool runs server-side.
  const adapter = useMemo<ExternalStoreAdapter<ThreadMessage>>(
    () => ({
      messageRepository,
      isRunning,
      isLoading,
      onNew,
      setMessages,
      onEdit,
      onReload,
      onCancel,
    }),
    [
      messageRepository,
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
    tailVersions,
    tailIndex,
    conversationId,
    isRunning,
    error,
    retry,
    setConversation,
    startNewConversation,
  };
}
