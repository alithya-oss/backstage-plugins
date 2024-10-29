import React from 'react';
import BarChartTemplate from '../BarChartTemplate';
import { useStatistics } from '../../../../hooks';
import {
  isTimeSaverApiError,
  TimeSavedStatistics,
} from '@alithya-oss/plugin-time-saver-common';
import {
  getUniqueTeamsFromStatistics,
  generateBackgroundColorSet,
  getBarChartOptions,
  buildIndividualStatisticsDataset,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';

/**
 * Props for {@link TemplateStatisticsBarChart}.
 *
 * @public
 */
export interface TemplateStatisticsBarChartProps {
  templateName: string;
}

/**
 * Displays a templates' statistic's bar chart component.
 *
 * @public
 */
const TemplateStatisticsBarChart = (props: TemplateStatisticsBarChartProps) => {
  const theme = useTheme();
  const apiResult = useStatistics({ template: props.templateName });
  // const apiResult = useStatistics();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }
    const teamNames = getUniqueTeamsFromStatistics(
      items as TimeSavedStatistics[],
    );
    const backgroundColors = generateBackgroundColorSet(teamNames.length);
    const datasets = buildIndividualStatisticsDataset(
      'Time Saved',
      items,
      backgroundColors,
    );

    return (
      <BarChartTemplate
        options={getBarChartOptions(theme, props.templateName)}
        data={{
          labels: teamNames,
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
export default TemplateStatisticsBarChart;
