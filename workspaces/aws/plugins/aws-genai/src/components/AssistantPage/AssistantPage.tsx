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

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from '@assistant-ui/react';
import type { ThreadMessageLike } from '@assistant-ui/react';
import { useParams } from 'react-router-dom';

const toMessage = (message: ThreadMessageLike) => message;
const noop = async () => {};

/**
 * Provisional body of the Assistant UI page: mounts the runtime over an empty
 * conversation so the route can be exercised before the thread surface exists.
 * The handler set is filled in by later slices.
 */
export const AssistantPageContent = () => {
  const { agentName } = useParams() as { agentName?: string };
  if (!agentName) {
    throw new Error('agent name is not defined');
  }

  const runtime = useExternalStoreRuntime({
    messages: [],
    isRunning: false,
    convertMessage: toMessage,
    onNew: noop,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div data-testid="aws-genai-assistant-page">
        Assistant for agent {agentName}
      </div>
    </AssistantRuntimeProvider>
  );
};
