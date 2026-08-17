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

import type { Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import PersonIcon from '@mui/icons-material/Person';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown';
import { BotIcon } from '../BotIcon';
import { ToolCallDetails } from './ToolCallDetails';
import type { ChatMessageData } from './useChatMessage';

interface ChatMessageViewProps {
  message: ChatMessageData;
  copiedText: string | null;
  selectedTool: string | null;
  onCopyCode: (text: string) => void;
  onToolToggle: (toolName: string) => void;
  onCopyToolResponse: (toolName: string) => void;
  getToolResponseForTool: (toolName: string) => string;
}

function getMarkdownSx(theme: Theme) {
  return {
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
      fontWeight: 600,
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    '& h1': { fontSize: '1.5rem' },
    '& h2': { fontSize: '1.3rem' },
    '& h3': { fontSize: '1.1rem' },
    '& p': {
      margin: theme.spacing(0.5, 0),
      lineHeight: 1.6,
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    '& ul, & ol': {
      margin: theme.spacing(0.5, 0),
      paddingLeft: theme.spacing(3),
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    '& li': {
      margin: theme.spacing(0.25, 0),
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      paddingLeft: theme.spacing(2),
      margin: theme.spacing(1, 0),
      fontStyle: 'italic',
      backgroundColor: theme.palette.background.default,
      padding: theme.spacing(1, 1, 1, 2),
      borderRadius: theme.spacing(0.5),
    },
    '& code': {
      backgroundColor: theme.palette.action.hover,
      color: theme.palette.text.primary,
      padding: '2px 4px',
      borderRadius: '3px',
      fontFamily: 'monospace',
      fontSize: '0.875em',
    },
    '& pre': {
      backgroundColor: theme.palette.background.default,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.spacing(0.5),
      padding: theme.spacing(1.5),
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      margin: theme.spacing(1, 0),
      overflow: 'auto',
      position: 'relative',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
        color: theme.palette.text.primary,
      },
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: theme.spacing(1, 0),
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0.5, 1),
      textAlign: 'left',
    },
    '& th': { backgroundColor: theme.palette.action.hover, fontWeight: 600 },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },
    '& hr': {
      border: 'none',
      borderTop: `1px solid ${theme.palette.divider}`,
      margin: theme.spacing(2, 0),
    },
  };
}

export const ChatMessageView = ({
  message,
  copiedText,
  selectedTool,
  onCopyCode,
  onToolToggle,
  onCopyToolResponse,
  getToolResponseForTool,
}: ChatMessageViewProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const avatarBg = message.isUser
    ? theme.palette.success.main
    : theme.palette.background.paper;

  let avatarColor: string;
  if (message.isUser) {
    avatarColor = theme.palette.success.contrastText;
  } else {
    avatarColor = isDarkMode
      ? theme.palette.text.primary
      : theme.palette.text.secondary;
  }

  let cardBg: string;
  if (message.isUser) {
    cardBg = isDarkMode
      ? theme.palette.background.paper
      : theme.palette.background.default;
  } else {
    cardBg = 'transparent';
  }
  const cardBorder = message.isUser
    ? `1px solid ${theme.palette.divider}`
    : 'none';

  const CodeBlock = ({ children, ...props }: any) => {
    const codeText = children?.props?.children || '';
    return (
      <Box sx={{ position: 'relative' }}>
        <pre {...props}>{children}</pre>
        <IconButton
          size="small"
          onClick={() => onCopyCode(codeText)}
          title={copiedText === codeText ? 'Copied!' : 'Copy code'}
          sx={{
            position: 'absolute',
            top: theme.spacing(0.5),
            right: theme.spacing(0.5),
            padding: theme.spacing(0.5),
            minWidth: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.9)' },
          }}
        >
          <FileCopyIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  };

  const textSx = {
    fontSize: '0.95rem',
    lineHeight: message.isUser ? 1.5 : 1.6,
    color: theme.palette.text.primary,
    fontWeight: message.isUser ? 500 : 'normal',
    fontFamily: message.isUser
      ? 'inherit'
      : '"Helvetica Neue", Helvetica, Arial, sans-serif',
  };

  const formatMessage = (text: string) => {
    if (!text || !text.trim()) {
      return (
        <Typography variant="body1" sx={textSx}>
          {text}
        </Typography>
      );
    }

    const hasMarkdown =
      /[#*_`\[\]]/g.test(text) ||
      text.includes('```') ||
      text.includes('\n') ||
      text.includes('|') ||
      text.includes('> ');

    if (hasMarkdown) {
      return (
        <Box sx={getMarkdownSx(theme)}>
          <ReactMarkdown components={{ pre: CodeBlock }}>{text}</ReactMarkdown>
        </Box>
      );
    }

    return (
      <Typography variant="body1" sx={textSx}>
        {text}
      </Typography>
    );
  };

  const toolsList = message.toolsUsed || message.tools;

  return (
    <Box
      data-testid="message-container"
      className={message.isUser ? 'user-message' : 'bot-message'}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing(4),
        marginBottom: theme.spacing(3),
      }}
    >
      <Avatar
        sx={{
          width: message.isUser ? 32 : 35,
          height: message.isUser ? 32 : 35,
          fontSize: '1rem',
          marginTop: theme.spacing(0.25),
          backgroundColor: avatarBg,
          color: avatarColor,
        }}
      >
        {message.isUser ? (
          <PersonIcon data-testid="person-icon" />
        ) : (
          <BotIcon
            data-testid="bot-icon"
            color={
              isDarkMode
                ? theme.palette.text.primary
                : theme.palette.text.secondary
            }
          />
        )}
      </Avatar>

      <Box>
        <Card
          sx={{
            maxWidth: '100%',
            position: 'relative',
            backgroundColor: cardBg,
            color: 'inherit',
            border: cardBorder,
            borderRadius: message.isUser ? theme.spacing(1) : 0,
            boxShadow: message.isUser ? theme.shadows[1] : 'none',
            '&:hover .message-actions': { opacity: 1 },
          }}
        >
          <Box sx={{ padding: message.isUser ? theme.spacing(1) : 0 }}>
            {formatMessage(message.text)}

            {toolsList && toolsList.length > 0 && (
              <ToolCallDetails
                tools={toolsList}
                selectedTool={selectedTool}
                copiedText={copiedText}
                onToolToggle={onToolToggle}
                onCopyToolResponse={onCopyToolResponse}
                getToolResponseForTool={getToolResponseForTool}
              />
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
};
