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

import { Text } from '@backstage/ui';
import {
  RiDeleteBinLine,
  RiStarFill,
  RiStarLine,
  RiTerminalBoxLine,
} from '@remixicon/react';
import type { ConversationRecord } from '../../types';
import styles from './ConversationListItem.module.css';

/**
 * Props of {@link ConversationListItem}.
 */
export interface ConversationListItemProps {
  /** The conversation to describe. */
  conversation: ConversationRecord;
  /** Whether this conversation is the one the page is holding. */
  isSelected: boolean;
  /** Loads this conversation into the page. */
  onSelect: () => void;
  /** Pins or unpins this conversation. */
  onToggleStar: () => void;
  /** Deletes this conversation. */
  onDelete: () => void;
}

/**
 * Falls back to the first user turn when the backend generated no title, which
 * is the case for a conversation stored before a title was produced.
 */
function displayTitle(conversation: ConversationRecord): string {
  if (conversation.title) {
    return conversation.title;
  }
  const firstPrompt = conversation.messages.find(
    message => message.role === 'user',
  );
  const content = firstPrompt?.content ?? 'Empty conversation';
  return content.length > 60 ? `${content.slice(0, 60)}…` : content;
}

/**
 * One stored conversation.
 *
 * The pin and delete controls sit as siblings of the select button rather than
 * inside it: nesting them would make one interactive element the child of
 * another, which is neither valid HTML nor operable by keyboard.
 */
export const ConversationListItem = ({
  conversation,
  isSelected,
  onSelect,
  onToggleStar,
  onDelete,
}: ConversationListItemProps) => {
  const title = displayTitle(conversation);
  const toolCount = conversation.toolsUsed?.length ?? 0;

  return (
    <li className={styles.root} data-selected={isSelected || undefined}>
      <button
        type="button"
        className={styles.select}
        onClick={onSelect}
        aria-current={isSelected || undefined}
        aria-label={title}
      >
        <Text variant="body-small" truncate>
          {title}
        </Text>
        <span className={styles.meta}>
          <Text variant="body-x-small" color="secondary">
            {new Date(conversation.updatedAt).toLocaleDateString()}
          </Text>
          {toolCount > 0 ? (
            <Text variant="body-x-small" color="secondary">
              <RiTerminalBoxLine aria-hidden className={styles.metaIcon} />
              {toolCount}
            </Text>
          ) : null}
        </span>
      </button>

      <span className={styles.actions}>
        <button
          type="button"
          className={styles.action}
          onClick={onToggleStar}
          aria-pressed={conversation.isStarred}
          aria-label={
            conversation.isStarred ? `Unpin ${title}` : `Pin ${title}`
          }
        >
          {conversation.isStarred ? (
            <RiStarFill aria-hidden className={styles.actionIcon} />
          ) : (
            <RiStarLine aria-hidden className={styles.actionIcon} />
          )}
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={onDelete}
          aria-label={`Delete ${title}`}
        >
          <RiDeleteBinLine aria-hidden className={styles.actionIcon} />
        </button>
      </span>
    </li>
  );
};
