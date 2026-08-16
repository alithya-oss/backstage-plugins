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

import { useState, useCallback } from 'react';

export interface ChatMessageData {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tools?: string[];
  toolsUsed?: string[];
  toolResponses?: any[];
}

export interface UseChatMessageResult {
  copiedText: string | null;
  selectedTool: string | null;
  handleCopyCode: (text: string) => Promise<void>;
  handleTooltipToggle: (toolName: string) => void;
  handleCopyToolResponse: (toolName: string) => Promise<void>;
  getToolResponseForTool: (toolName: string) => string;
}

export function useChatMessage(message: ChatMessageData): UseChatMessageResult {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleCopyCode = useCallback(async (text: string) => {
    try {
      await window.navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy text:', err);
    }
  }, []);

  const handleTooltipToggle = useCallback(
    (toolName: string) => {
      setSelectedTool(selectedTool === toolName ? null : toolName);
    },
    [selectedTool],
  );

  const getToolResponseForTool = useCallback(
    (toolName: string): string => {
      if (!message.toolsUsed || !message.toolResponses) {
        return 'No tools used or no tool responses available';
      }

      const toolResponse = message.toolResponses.find(
        (response: any) => response.name === toolName,
      );

      if (!toolResponse) {
        return `No response data found for tool: ${toolName}`;
      }

      return JSON.stringify(toolResponse, null, 2);
    },
    [message.toolsUsed, message.toolResponses],
  );

  const handleCopyToolResponse = useCallback(
    async (toolName: string) => {
      try {
        const toolResponse = getToolResponseForTool(toolName);
        await window.navigator.clipboard.writeText(toolResponse);
        setCopiedText(toolResponse);
        setTimeout(() => setCopiedText(null), 2000);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to copy tool response:', err);
      }
    },
    [getToolResponseForTool],
  );

  return {
    copiedText,
    selectedTool,
    handleCopyCode,
    handleTooltipToggle,
    handleCopyToolResponse,
    getToolResponseForTool,
  };
}
