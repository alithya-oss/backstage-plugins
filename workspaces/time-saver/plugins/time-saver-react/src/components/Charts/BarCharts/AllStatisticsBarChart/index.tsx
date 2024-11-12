import React from 'react';
import BarChartTemplate from '../BarChartTemplate';
import { useStatistics } from '../../../../hooks';
import {
  isTimeSaverApiError,
  TimeSavedStatistics,
} from '@alithya-oss/plugin-time-saver-common';
import {
  getUniqueTeamsFromStatistics,
  getUniqueTemplateNamesFromStatistics,
  generateBackgroundColorSet,
  buildDatasetsFromStatistics,
  getBarChartOptions,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';

/**
 * Displays all statistics using a bar chart component.
 *
 * @public
 */
const AllStatisticsBarChart = () => {
  const theme = useTheme();
  // const apiResult = useStatistics([{team: props.teamName}]);
  const apiResult = useStatistics();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }
    const teamNames = getUniqueTeamsFromStatistics(
      items as TimeSavedStatistics[],
    );
    const templateNames = getUniqueTemplateNamesFromStatistics(
      items as TimeSavedStatistics[],
    );
    const backgroundColors = generateBackgroundColorSet(teamNames.length);
    const datasets = buildDatasetsFromStatistics(
      templateNames,
      teamNames,
      items,
      backgroundColors,
    );

    return (
      <BarChartTemplate
        options={getBarChartOptions(theme, 'All Statistics')}
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
export default AllStatisticsBarChart;
