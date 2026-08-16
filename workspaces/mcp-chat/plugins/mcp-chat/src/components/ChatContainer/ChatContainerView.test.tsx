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

import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ChatContainerView } from './ChatContainerView';

jest.mock('./ChatMessage', () => ({
  ChatMessage: ({ message }: any) => (
    <div role="article">
      <span>{message.text}</span>
    </div>
  ),
}));

jest.mock('./QuickStart', () => ({
  QuickStart: ({ onSuggestionClick }: any) => (
    <div>
      <button onClick={() => onSuggestionClick('Hello')}>Suggestion</button>
    </div>
  ),
}));

jest.mock('./TypingIndicator', () => ({
  TypingIndicator: () => <span>Typing...</span>,
}));

const defaultProps = {
  sidebarCollapsed: false,
  messages: [] as any[],
  inputValue: '',
  isTyping: false,
  messagesEndRef: createRef<HTMLDivElement>(),
  onInputChange: jest.fn(),
  onSendMessage: jest.fn(),
  onSuggestionClick: jest.fn(),
  onKeyPress: jest.fn(),
};

const renderView = (props = {}) => {
  const theme = createTheme();
  return render(
    <ThemeProvider theme={theme}>
      <ChatContainerView {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe('ChatContainerView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders QuickStart when messages array is empty', () => {
    renderView();
    expect(screen.getByText('Suggestion')).toBeInTheDocument();
  });

  it('renders messages when messages exist', () => {
    const messages = [
      { id: '1', text: 'User message', isUser: true, timestamp: new Date() },
      { id: '2', text: 'Bot response', isUser: false, timestamp: new Date() },
    ];
    renderView({ messages });

    expect(screen.getByText('User message')).toBeInTheDocument();
    expect(screen.getByText('Bot response')).toBeInTheDocument();
  });

  it('shows TypingIndicator when isTyping is true and messages exist', () => {
    const messages = [
      { id: '1', text: 'Hello', isUser: true, timestamp: new Date() },
    ];
    renderView({ messages, isTyping: true });

    expect(screen.getByText('Typing...')).toBeInTheDocument();
  });

  it('does not show TypingIndicator when isTyping is false', () => {
    const messages = [
      { id: '1', text: 'Hello', isUser: true, timestamp: new Date() },
    ];
    renderView({ messages, isTyping: false });

    expect(screen.queryByText('Typing...')).not.toBeInTheDocument();
  });

  it('renders text input with placeholder', () => {
    renderView();
    expect(
      screen.getByPlaceholderText('Message Assistant...'),
    ).toBeInTheDocument();
  });

  it('calls onInputChange when text is typed', () => {
    const onInputChange = jest.fn();
    renderView({ onInputChange });

    const input = screen.getByPlaceholderText('Message Assistant...');
    fireEvent.change(input, { target: { value: 'Test input' } });

    expect(onInputChange).toHaveBeenCalledWith('Test input');
  });

  it('disables send button when inputValue is empty', () => {
    renderView({ inputValue: '' });

    const sendButton = screen.getByRole('button', { name: '' });
    expect(sendButton).toBeDisabled();
  });

  it('enables send button when inputValue has content', () => {
    renderView({ inputValue: 'Some text' });

    const buttons = screen.getAllByRole('button');
    // Find the send button (the IconButton)
    const iconButton = buttons[buttons.length - 1];
    expect(iconButton).not.toBeDisabled();
  });

  it('calls onSendMessage when send button is clicked', () => {
    const onSendMessage = jest.fn();
    renderView({ inputValue: 'Hello world', onSendMessage });

    const buttons = screen.getAllByRole('button');
    const sendButton = buttons[buttons.length - 1];
    fireEvent.click(sendButton);

    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  it('calls onKeyPress when key is pressed in input', () => {
    const onKeyPress = jest.fn();
    renderView({ onKeyPress });

    const input = screen.getByPlaceholderText('Message Assistant...');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(onKeyPress).toHaveBeenCalled();
  });

  it('disables input when isTyping is true', () => {
    renderView({ isTyping: true });

    const input = screen.getByPlaceholderText('Message Assistant...');
    expect(input).toBeDisabled();
  });

  it('calls onSuggestionClick when QuickStart suggestion is clicked', () => {
    const onSuggestionClick = jest.fn();
    renderView({ onSuggestionClick });

    fireEvent.click(screen.getByText('Suggestion'));
    expect(onSuggestionClick).toHaveBeenCalledWith('Hello');
  });
});
