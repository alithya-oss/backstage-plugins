import React from 'react';
import { GaugeTemplate } from '../GaugeTemplate';
import { useTimeSavedSum } from '../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import { getRandomColor } from '../../utils';
import { CircularProgress } from '@material-ui/core';

/**
 * Props for {@link TimeSavedGauge}.
 *
 * @public
 */
export interface TimeSavedGaugeProps {
  label?: string;
  divider?: number;
}

/**
 * Displays a gauge component with the time saved from using templates.
 *
 * @public
 */
const TimeSavedGauge = (props: TimeSavedGaugeProps) => {
  const apiResult = useTimeSavedSum(
    props.divider ? { divider: props.divider } : undefined,
  );
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }

    return (
      <GaugeTemplate
        avatarColor={getRandomColor()}
        heading={props.label || 'Time Saved [Global]'}
        data={items}
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
export default TimeSavedGauge;
