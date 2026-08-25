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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatHistoryComponent } from './ChatHistoryComponent';
import { ChatMessage } from '../types';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

jest.mock('remark-gfm', () => ({ __esModule: true, default: () => undefined }));

const userMessage: ChatMessage = {
  type: 'user',
  payload: 'How do I deploy?',
  tools: [],
};

const agentMessage: ChatMessage = {
  type: 'agent',
  payload: 'Use the pipeline.',
  tools: [{ name: 'listPipelines', input: '{"region":"us-east-1"}' }],
};

describe('ChatHistoryComponent', () => {
  it('should render the empty state when there is no message', () => {
    render(<ChatHistoryComponent messages={[]} showInformation />);

    expect(screen.getByText('Start chatting!')).toBeInTheDocument();
    expect(
      screen.getByText(/This assistant can answer questions for you/),
    ).toBeInTheDocument();
  });

  it('should render messages, a placeholder for empty payloads and no tool button when information is hidden', () => {
    render(
      <ChatHistoryComponent
        messages={[
          userMessage,
          agentMessage,
          { type: 'agent', payload: '', tools: [] },
        ]}
        showInformation={false}
      />,
    );

    expect(screen.getByText('How do I deploy?')).toBeInTheDocument();
    expect(screen.getByText('Use the pipeline.')).toBeInTheDocument();
    expect(screen.getByText('Working...')).toBeInTheDocument();
    expect(screen.queryByText('Start chatting!')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show tool calls' }),
    ).not.toBeInTheDocument();
  });

  it('should open the tools dialog with the tool call payload', async () => {
    render(
      <ChatHistoryComponent
        messages={[userMessage, agentMessage]}
        showInformation
      />,
    );

    const toolButtons = screen.getAllByRole('button', {
      name: 'Show tool calls',
    });
    expect(toolButtons).toHaveLength(1);

    await userEvent.click(toolButtons[0]);

    expect(await screen.findByText('Tools')).toBeInTheDocument();
    expect(await screen.findByText('listPipelines')).toBeInTheDocument();
  });
});
