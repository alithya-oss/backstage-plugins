import React from 'react';
import LineChartTemplate from '../LineChartTemplate';
import { useTimeSummaryPerTemplate } from '../../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import {
  getLineChartOptions,
  buildTimeSummaryPerTemplateDataset,
  getDatesFromStatistics,
  getUniqueTemplateNamesFromStatistics,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';
import { DateTime } from 'luxon';

/**
 * Props for {@link TimeSummaryPerTemplateLineChart}.
 *
 * @public
 */
export interface TimeSummaryPerTemplateLineChartProps {
  templateName?: string;
}

/**
 * Displays a line chart component from a time-saved summary per template dataset.
 *
 * @public
 */
const TimeSummaryPerTemplateLineChart = (
  props: TimeSummaryPerTemplateLineChartProps,
) => {
  const theme = useTheme();
  const apiResult = useTimeSummaryPerTemplate();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }
    items.sort(
      (a: { date: DateTime }, b: { date: DateTime }) =>
        DateTime.fromISO(a.date.toString()).toMillis() -
        DateTime.fromISO(b.date.toString()).toMillis(),
    );
    const filteredItems = props.templateName
      ? items
          .filter(stat => stat.templateName === props.templateName)
          .map(stat => ({
            ...stat,
            date: DateTime.fromISO(stat.date.toString()).toFormat('yyyy-MM-dd'),
          }))
      : items.map(stat => ({
          ...stat,
          date: DateTime.fromISO(stat.date.toString()).toFormat('yyyy-MM-dd'),
        }));
    const templateNames = getUniqueTemplateNamesFromStatistics(filteredItems);
    const uniqueDates = getDatesFromStatistics(filteredItems);
    const datasets = buildTimeSummaryPerTemplateDataset(
      templateNames,
      filteredItems,
    );

    return (
      <LineChartTemplate
        options={getLineChartOptions(theme, 'Time Summary by Template')}
        data={{
          labels: uniqueDates,
          datasets,
        }}
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
export default TimeSummaryPerTemplateLineChart;
