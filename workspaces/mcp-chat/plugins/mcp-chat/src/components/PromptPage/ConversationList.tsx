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
import { Button, SearchField, Text } from '@backstage/ui';
import { RiAddLine, RiHistoryLine } from '@remixicon/react';
import type { ConversationRecord } from '../../types';
import { ConversationListItem } from './ConversationListItem';
import styles from './ConversationList.module.css';

/**
 * Props of {@link ConversationList}.
 */
export interface ConversationListProps {
  /** Pinned conversations, as `useConversations` groups them. */
  starred: ConversationRecord[];
  /** Unpinned conversations, as `useConversations` groups them. */
  recent: ConversationRecord[];
  /** Whether the list is being fetched. */
  loading: boolean;
  /** The current search text. */
  searchQuery: string;
  /** Reports typed search text to `useConversations`. */
  onSearchChange: (query: string) => void;
  /** ID of the conversation the page is holding, if it came from the list. */
  selectedId?: string | undefined;
  /** Loads a conversation into the page. Rejections are reported in place. */
  onSelect: (id: string) => Promise<void>;
  /** Pins or unpins a conversation. Rejections are reported in place. */
  onToggleStar: (id: string) => Promise<void>;
  /** Deletes a conversation. Rejections are reported in place. */
  onDelete: (id: string) => Promise<void>;
  /** Clears the page's conversation and its active conversation id. */
  onNewConversation: () => void;
}

/** Most recently updated first, which is the order the requirement fixes. */
function byMostRecent(
  conversations: ConversationRecord[],
): ConversationRecord[] {
  return [...conversations].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

/**
 * The stored conversation list.
 *
 * This list is deliberately the panel's own rather than Assistant UI's thread
 * list: that adapter's thread status is exactly `regular | archived`, which has
 * no room for a pinned conversation, and it carries no notion of search — so
 * adopting it would cost the two features this list exists to provide.
 *
 * Every mutation is optimistic inside `useConversations`, which rolls its own
 * state back when the request fails. What rollback cannot do is tell the user,
 * so a rejected pin, delete or load surfaces here as an alert next to the list.
 */
export const ConversationList = ({
  starred,
  recent,
  loading,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  onToggleStar,
  onDelete,
  onNewConversation,
}: ConversationListProps) => {
  const [notice, setNotice] = useState<string | undefined>();

  const pinned = useMemo(() => byMostRecent(starred), [starred]);
  const unpinned = useMemo(() => byMostRecent(recent), [recent]);
  const isEmpty = pinned.length === 0 && unpinned.length === 0;

  const report = useCallback(
    async (action: () => Promise<void>, message: string) => {
      setNotice(undefined);
      try {
        await action();
      } catch {
        setNotice(message);
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (id: string) =>
      report(() => onSelect(id), 'That conversation could not be opened.'),
    [report, onSelect],
  );

  const handleToggleStar = useCallback(
    (id: string) =>
      report(() => onToggleStar(id), 'That conversation could not be pinned.'),
    [report, onToggleStar],
  );

  const handleDelete = useCallback(
    (id: string) =>
      report(() => onDelete(id), 'That conversation could not be deleted.'),
    [report, onDelete],
  );

  const renderItem = (conversation: ConversationRecord) => (
    <ConversationListItem
      key={conversation.id}
      conversation={conversation}
      isSelected={conversation.id === selectedId}
      onSelect={() => handleSelect(conversation.id)}
      onToggleStar={() => handleToggleStar(conversation.id)}
      onDelete={() => handleDelete(conversation.id)}
    />
  );

  return (
    <section className={styles.root} aria-labelledby="conversations-heading">
      <div className={styles.header}>
        <h2 className={styles.heading} id="conversations-heading">
          <RiHistoryLine aria-hidden className={styles.headingIcon} />
          Conversations
        </h2>
        <Button
          size="small"
          variant="secondary"
          iconStart={<RiAddLine />}
          onPress={onNewConversation}
        >
          New
        </Button>
      </div>

      <SearchField
        aria-label="Search conversations"
        placeholder="Search conversations…"
        value={searchQuery}
        onChange={onSearchChange}
      />

      {notice ? (
        <div className={styles.notice} role="alert">
          <Text variant="body-small">{notice}</Text>
        </div>
      ) : null}

      {loading && isEmpty ? (
        <Text variant="body-small" color="secondary">
          Loading conversations…
        </Text>
      ) : null}

      {!loading && isEmpty ? (
        <Text variant="body-small" color="secondary">
          {searchQuery
            ? 'No conversation matches your search.'
            : 'No stored conversations yet.'}
        </Text>
      ) : null}

      {pinned.length > 0 ? (
        <>
          <Text
            variant="body-x-small"
            color="secondary"
            className={styles.group}
          >
            Pinned
          </Text>
          <ul className={styles.list} aria-label="Pinned conversations">
            {pinned.map(renderItem)}
          </ul>
        </>
      ) : null}

      {unpinned.length > 0 ? (
        <>
          {pinned.length > 0 ? (
            <Text
              variant="body-x-small"
              color="secondary"
              className={styles.group}
            >
              Recent
            </Text>
          ) : null}
          <ul className={styles.list} aria-label="Recent conversations">
            {unpinned.map(renderItem)}
          </ul>
        </>
      ) : null}
    </section>
  );
};
