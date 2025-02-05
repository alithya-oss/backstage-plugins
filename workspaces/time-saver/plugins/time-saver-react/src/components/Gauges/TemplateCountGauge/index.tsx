import React from 'react';
import { GaugeTemplate } from '../GaugeTemplate';
import { useTemplates } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import { getRandomColor } from '../../utils';
import { CircularProgress } from '@material-ui/core';

/**
 * Displays a gauge component with the template count.
 *
 * @public
 */
const TemplateCountGauge = () => {
  const apiResult = useTemplates();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    return (
      <GaugeTemplate
        avatarColor={getRandomColor()}
        heading="Templates"
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
export default TemplateCountGauge;
