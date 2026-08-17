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
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ChatMessageView } from './ChatMessageView';

jest.mock('react-markdown', () => {
  return function MockReactMarkdown(props: any) {
    return <div>{props.children}</div>;
  };
});

jest.mock('../BotIcon', () => ({
  BotIcon: (props: any) => (
    <svg {...props}>
      <path />
    </svg>
  ),
}));

jest.mock('./ToolCallDetails', () => ({
  ToolCallDetails: ({ tools }: any) => <div>Tools used ({tools.length})</div>,
}));

const defaultProps = {
  copiedText: null,
  selectedTool: null,
  onCopyCode: jest.fn(),
  onToolToggle: jest.fn(),
  onCopyToolResponse: jest.fn(),
  getToolResponseForTool: jest.fn().mockReturnValue('{}'),
};

const renderView = (messageOverrides = {}, propOverrides = {}) => {
  const theme = createTheme();
  const message = {
    id: 'msg-1',
    text: 'Hello world',
    isUser: true,
    timestamp: new Date(),
    ...messageOverrides,
  };

  return render(
    <ThemeProvider theme={theme}>
      <ChatMessageView {...defaultProps} {...propOverrides} message={message} />
    </ThemeProvider>,
  );
};

describe('ChatMessageView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user message text', () => {
    renderView({ text: 'User says hello' });
    expect(screen.getByText('User says hello')).toBeInTheDocument();
  });

  it('renders assistant message text', () => {
    renderView({ text: 'Assistant responds', isUser: false });
    expect(screen.getByText('Assistant responds')).toBeInTheDocument();
  });

  it('renders PersonIcon for user messages', () => {
    renderView({ isUser: true });
    expect(screen.getByTestId('person-icon')).toBeInTheDocument();
  });

  it('renders BotIcon for assistant messages', () => {
    renderView({ isUser: false });
    expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
  });

  it('applies user-message class for user messages', () => {
    renderView({ isUser: true });
    expect(screen.getByTestId('message-container')).toHaveClass('user-message');
  });

  it('applies bot-message class for assistant messages', () => {
    renderView({ isUser: false });
    expect(screen.getByTestId('message-container')).toHaveClass('bot-message');
  });

  it('renders markdown content for messages with markdown syntax', () => {
    renderView({ text: '# Heading\n\nSome **bold** text', isUser: false });
    // ReactMarkdown mock renders children as text — verify content is present
    const container = screen.getByTestId('message-container');
    expect(container.textContent).toContain('# Heading');
    expect(container.textContent).toContain('Some **bold** text');
  });

  it('displays ToolCallDetails when tools are present', () => {
    renderView({
      isUser: false,
      toolsUsed: ['search', 'calculator'],
    });
    expect(screen.getByText('Tools used (2)')).toBeInTheDocument();
  });

  it('does not display ToolCallDetails when no tools', () => {
    renderView({ isUser: false, toolsUsed: undefined });
    expect(screen.queryByText(/Tools used/)).not.toBeInTheDocument();
  });

  it('handles empty text gracefully', () => {
    renderView({ text: '', isUser: true });
    // Should not throw and should still render the container
    expect(screen.getByTestId('message-container')).toBeInTheDocument();
  });

  it('handles whitespace-only text', () => {
    renderView({ text: '   ', isUser: true });
    expect(screen.getByTestId('message-container')).toBeInTheDocument();
  });
});
