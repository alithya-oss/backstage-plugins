import React from 'react';
import { AutocompleteTemplate } from '../AutocompleteTemplate';
import { useTemplates } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/plugin-time-saver-common';
import { CircularProgress } from '@material-ui/core';

/**
 * Props for {@link TemplateNameAutocomplete}.
 *
 * @public
 */
export interface TemplateNameAutocompleteProps {
  onTemplateChange: (templateUsed: string) => void;
}

/**
 * Displays an autocomplete component with time-saver's template names options.
 *
 * @public
 */
const TemplateNameAutocomplete = (props: TemplateNameAutocompleteProps) => {
  const apiResult = useTemplates();
  const { loading, error, items } = apiResult;

  const [_task, setTask] = React.useState('');

  const onChangeHandler = (
    _event: React.ChangeEvent<NonNullable<unknown>>,
    value: string | null,
  ) => {
    const selectedTemplateTaskId = value || '';
    setTask(selectedTemplateTaskId);
    props.onTemplateChange(selectedTemplateTaskId);
  };

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    return (
      <AutocompleteTemplate
        {...props}
        label="Template Name"
        options={items}
        onChangeHandler={onChangeHandler}
      />
    );
  }

  return (
    <>
      <>{loading && <CircularProgress />}</>
      <>{error ? `Error: ${apiResult.error}` : ''}</>
    </>
  );
};
export default TemplateNameAutocomplete;
