import React from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';

export interface SelectorTemplateViewProps {
  handleChange?: (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
    child: React.ReactNode,
  ) => void;
  handleClearClick?: React.MouseEventHandler<HTMLButtonElement>;
  onClearButtonClick?: boolean;
  defaultValue: string;
  label: string;
  items: string[];
}

const SelectorTemplateView = (props: SelectorTemplateViewProps) => (
  <>
    <Box style={{ minWidth: 360, display: 'flex', flexWrap: 'nowrap', gap: 6 }}>
      <FormControl fullWidth variant="outlined">
        <InputLabel>Team</InputLabel>
        <Select
          value={props.defaultValue}
          label={props.label || 'SelectorTemplate'}
          onChange={props.handleChange}
        >
          {props.items.map(item => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {props.onClearButtonClick && (
        <Button
          variant="outlined"
          color="secondary"
          onClick={props.handleClearClick}
        >
          Clear
        </Button>
      )}
    </Box>
  </>
);
export default SelectorTemplateView;
