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

import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Card, CardBody, FullPage, Header, Skeleton } from '@backstage/ui';
import { useParams } from 'react-router-dom';
import { ChatHistoryComponent } from '../ChatHistoryComponent';
import { ChatInputComponent } from '../ChatInputComponent';
import { useChatSession } from '../../hooks';
import styles from './AgentPage.module.css';

/**
 * Props for the agent chat page.
 *
 * @public
 */
export interface AgentPageProps {
  title?: string;
}

/**
 * The chat body, shared by the legacy and the new frontend system variants.
 * It deliberately renders no page shell of its own.
 */
export const AgentPageContent = () => {
  const config = useApi(configApiRef);
  const showInformation =
    config.getOptionalBoolean('genai.chat.showInformation') ?? false;

  const params = useParams() as { agentName: string };
  const agentName = params.agentName;

  if (!agentName) {
    throw new Error('agent name is not defined');
  }

  const {
    messages,
    isInitializing,
    isLoading,
    onUserMessage,
    onClear,
    onCancel,
  } = useChatSession({
    agentName,
  });

  if (isInitializing) {
    return (
      <div className={styles.initializing}>
        <Skeleton height={24} />
        <Skeleton height={24} width="60%" />
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <ChatHistoryComponent
        messages={messages}
        className={styles.history}
        isStreaming={isLoading}
        showInformation={showInformation}
      />
      <div className={styles.inputContainer}>
        <Card>
          <CardBody>
            <ChatInputComponent
              onMessage={onUserMessage}
              disabled={isLoading}
              onClear={onClear}
              onCancel={onCancel}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

/**
 * Agent chat page for the legacy frontend system, including its own page shell.
 *
 * @public
 */
export const AgentPage = ({ title = 'Chat Assistant' }: AgentPageProps) => (
  <FullPage className={styles.page}>
    <Header title={title} />
    <AgentPageContent />
  </FullPage>
);

/**
 * Agent chat page for the new frontend system. The framework renders the page
 * header, so this variant only contributes the chat body.
 *
 * @public
 */
export const NfsAgentPage = () => <AgentPageContent />;
