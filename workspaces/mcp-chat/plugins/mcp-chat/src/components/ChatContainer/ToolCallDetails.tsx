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

import { useTheme } from '@mui/material/styles';
import BuildIcon from '@mui/icons-material/Build';
import CodeIcon from '@mui/icons-material/Code';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

interface ToolCallDetailsProps {
  tools: string[];
  selectedTool: string | null;
  copiedText: string | null;
  onToolToggle: (toolName: string) => void;
  onCopyToolResponse: (toolName: string) => void;
  getToolResponseForTool: (toolName: string) => string;
}

export const ToolCallDetails = ({
  tools,
  selectedTool,
  copiedText,
  onToolToggle,
  onCopyToolResponse,
  getToolResponseForTool,
}: ToolCallDetailsProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        marginTop: theme.spacing(1.5),
        padding: theme.spacing(1, 0),
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing(0.5),
          marginBottom: theme.spacing(1),
          color: theme.palette.text.primary,
          fontSize: '0.85rem',
          fontWeight: 600,
          flexWrap: 'wrap',
        }}
      >
        <BuildIcon fontSize="small" />
        <Typography variant="caption" style={{ fontWeight: 'bold' }}>
          Tools used ({tools.length})
        </Typography>
        {tools.map(tool => (
          <Chip
            key={tool}
            label={tool}
            size="small"
            clickable
            onClick={() => onToolToggle(tool)}
            icon={<CodeIcon fontSize="small" />}
            sx={{
              height: 24,
              fontSize: '0.75rem',
              fontWeight: 500,
              backgroundColor: 'transparent',
              color:
                selectedTool === tool
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
              margin: '0 4px 0 8px',
              border:
                selectedTool === tool
                  ? `2px solid ${theme.palette.primary.main}`
                  : `1px solid ${theme.palette.divider}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: 'translateY(-1px)',
              },
            }}
          />
        ))}
      </Box>

      {/* Tool responses - shown below the chips */}
      {tools.map(tool => (
        <Collapse key={`collapse-${tool}`} in={selectedTool === tool}>
          <Card
            sx={{
              marginTop: theme.spacing(1),
              backgroundColor: theme.palette.background.default,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.spacing(1),
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: theme.spacing(1, 1.5),
                backgroundColor: theme.palette.action.hover,
                borderBottom: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.spacing(1, 1, 0, 0),
              }}
            >
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                {tool} Response
              </Typography>
              <IconButton
                size="small"
                onClick={() => onCopyToolResponse(tool)}
                title={copiedText ? 'Copied!' : 'Copy response'}
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                <FileCopyIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box
              sx={{
                padding: theme.spacing(1.5),
                maxHeight: '300px',
                overflow: 'auto',
              }}
            >
              <Box
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: theme.spacing(0.5),
                  padding: theme.spacing(1.5),
                  fontFamily:
                    'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                  fontSize: '0.8rem',
                  lineHeight: 1.4,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: theme.palette.text.primary,
                }}
              >
                {getToolResponseForTool(tool)}
              </Box>
            </Box>
          </Card>
        </Collapse>
      ))}
    </Box>
  );
};
