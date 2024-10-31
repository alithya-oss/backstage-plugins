import React from 'react';
import AutocompleteTemplateView from './view';
import {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from '@mui/material/Autocomplete';

const options = ['The Godfather', 'Pulp Fiction'];

/**
 * Props for {@link AutocompleteTemplate}.
 *
 * @public
 */
export interface AutocompleteTemplateProps {
  label?: string;
  options?: string[];
  onChangeHandler: (
    event: React.SyntheticEvent,
    value: string | null,
    reason?: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string | null>,
  ) => void;
}

/**
 * Displays an autocomplete component.
 *
 * @public
 */
export function AutocompleteTemplate(props: AutocompleteTemplateProps) {
  return (
    <AutocompleteTemplateView {...props} options={props.options || options} />
  );
}
