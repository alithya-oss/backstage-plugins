import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
} from '@mui/material/Autocomplete';

export interface AutocompleteTemplateViewProps {
  id?: string;
  options: ReadonlyArray<string>;
  label?: string;
  onChangeHandler: (
    event: React.SyntheticEvent,
    value: string | null,
    reason: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string | null>,
  ) => void;
}

export default function AutocompleteTemplateView(
  props: AutocompleteTemplateViewProps,
) {
  return (
    <Autocomplete
      id={props.id || 'combo-box-demo'}
      disablePortal
      options={props.options}
      onChange={props.onChangeHandler}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          label={props.label || 'Autocomplete Template'}
        />
      )}
    />
  );
}
