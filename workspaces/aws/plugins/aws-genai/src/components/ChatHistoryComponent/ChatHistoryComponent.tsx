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

import { useEffect, useRef, useState } from 'react';
import { ButtonIcon, Text } from '@backstage/ui';
import {
  RiErrorWarningLine,
  RiInformationLine,
  RiRobot2Line,
  RiUser3Line,
} from '@remixicon/react';
import { ChatMessage, ToolRecord } from '../types';
import { MarkdownContent } from '../MarkdownContent';
import { ToolsModal } from './ToolsModal';
import styles from './ChatHistoryComponent.module.css';

export interface ChatHistoryComponentProps {
  messages?: ChatMessage[];
  isStreaming?: boolean;
  className?: string;
  showInformation: boolean;
}

function getMessageVariant(message: ChatMessage): 'user' | 'error' | 'agent' {
  if (message.type === 'user') {
    return 'user';
  }

  if (message.type === 'error') {
    return 'error';
  }

  return 'agent';
}

function MessageIcon({ message }: { message: ChatMessage }) {
  switch (getMessageVariant(message)) {
    case 'user':
      return <RiUser3Line size={20} aria-hidden />;
    case 'error':
      return <RiErrorWarningLine size={20} aria-hidden />;
    default:
      return <RiRobot2Line size={20} aria-hidden />;
  }
}

export const ChatHistoryComponent = ({
  messages = [],
  className,
  showInformation,
}: ChatHistoryComponentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages]);

  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<ToolRecord[]>([]);

  const handleOpen = (message: ChatMessage) => {
    setTools(message.tools);
    setOpen(true);
  };

  return (
    <div
      className={
        className ? `${styles.container} ${className}` : styles.container
      }
    >
      <div className={styles.scrollArea} ref={contentRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <Text as="h3" variant="title-medium" weight="bold">
              Start chatting!
            </Text>
            <Text color="secondary">
              This assistant can answer questions for you, type a message below
              to get started.
            </Text>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className={styles.chatItem}
              data-variant={getMessageVariant(message)}
            >
              <div className={styles.chatItemMeta}>
                <div className={styles.chatItemAvatar}>
                  <MessageIcon message={message} />
                </div>
                {message.tools.length > 0 && showInformation && (
                  <ButtonIcon
                    variant="tertiary"
                    size="small"
                    aria-label="Show tool calls"
                    icon={<RiInformationLine />}
                    onPress={() => handleOpen(message)}
                  />
                )}
              </div>
              <MarkdownContent
                className={styles.chatItemContent}
                content={
                  message.payload.length === 0 ? 'Working...' : message.payload
                }
              />
            </div>
          ))
        )}
      </div>
      <ToolsModal open={open} onOpenChange={setOpen} tools={tools} />
    </div>
  );
};
