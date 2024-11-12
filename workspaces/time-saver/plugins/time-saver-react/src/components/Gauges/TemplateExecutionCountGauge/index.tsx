import React from 'react';
import { GaugeTemplate } from '../GaugeTemplate';
import { useTemplateTasks } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/plugin-time-saver-common';
import { getRandomColor } from '../../utils';
import { CircularProgress } from '@material-ui/core';

/**
 * Displays a gauge component with the number of templates executed and completed.
 *
 * @public
 */
const TemplateExecutionsCountGauge = () => {
  const apiResult = useTemplateTasks();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    return (
      <GaugeTemplate
        avatarColor={getRandomColor()}
        heading="Template Executions"
        data={items.length}
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
export default TemplateExecutionsCountGauge;
