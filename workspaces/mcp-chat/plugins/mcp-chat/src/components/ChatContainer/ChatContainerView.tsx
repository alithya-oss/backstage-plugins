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

import type { RefObject } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';
import { ChatMessage } from './ChatMessage';
import { QuickStart } from './QuickStart';
import { TypingIndicator } from './TypingIndicator';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  tools?: string[];
  toolsUsed?: string[];
  toolResponses?: any[];
}

interface ChatContainerViewProps {
  sidebarCollapsed: boolean;
  messages: Message[];
  inputValue: string;
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSuggestionClick: (suggestion: string) => void;
  onKeyPress: (event: React.KeyboardEvent) => void;
}

export function ChatContainerView(props: ChatContainerViewProps) {
  const {
    sidebarCollapsed,
    messages,
    inputValue,
    isTyping,
    messagesEndRef,
    onInputChange,
    onSendMessage,
    onSuggestionClick,
    onKeyPress,
  } = props;

  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginRight: sidebarCollapsed ? '60px' : '400px',
        transition: 'margin-right 0.3s ease',
      }}
    >
      {messages.length === 0 ? (
        <QuickStart onSuggestionClick={onSuggestionClick} />
      ) : (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            padding: theme.spacing(6),
            paddingBottom: theme.spacing(10),
            paddingRight: theme.spacing(14),
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1),
            backgroundColor: theme.palette.background.default,
            scrollbarGutter: 'stable',
          }}
        >
          {messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </Box>
      )}

      <Box
        sx={{
          marginLeft: '14rem',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: sidebarCollapsed ? '60px' : '400px',
          padding: theme.spacing(2),
          borderTop: `1px solid ${theme.palette.divider}`,
          borderLeft: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(1),
          backgroundColor: theme.palette.background.paper,
          zIndex: 1000,
          transition: 'right 0.3s ease',
        }}
      >
        <TextField
          sx={{
            marginLeft: theme.spacing(5),
            marginRight: theme.spacing(5),
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: theme.spacing(3),
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          }}
          placeholder="Message Assistant..."
          variant="outlined"
          multiline
          maxRows={4}
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          size="small"
          disabled={isTyping}
          color="primary"
        />
        <IconButton
          sx={{
            backgroundColor:
              !inputValue.trim() || isTyping
                ? theme.palette.action.disabledBackground
                : theme.palette.primary.main,
            color:
              !inputValue.trim() || isTyping
                ? theme.palette.text.disabled
                : theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor:
                !inputValue.trim() || isTyping
                  ? theme.palette.action.disabledBackground
                  : theme.palette.primary.dark,
            },
            '&:disabled': {
              backgroundColor: theme.palette.action.disabledBackground,
              color: theme.palette.text.disabled,
            },
          }}
          onClick={onSendMessage}
          disabled={!inputValue.trim() || isTyping}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
