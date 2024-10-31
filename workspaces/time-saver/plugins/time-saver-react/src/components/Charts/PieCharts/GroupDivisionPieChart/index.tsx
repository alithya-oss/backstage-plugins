import React from 'react';
import PieChartTemplate from '../PieChartTemplate';
import { useGroupDivisionStatistics } from '../../../../hooks';
import {
  GroupSavingsDivision,
  isTimeSaverApiError,
} from '@alithya-oss/plugin-time-saver-common';
import {
  getUniqueTeamsFromStatistics,
  generateBackgroundColorSet,
  buildDatasetsFromPieChart,
  getPieChartOptions,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';

/**
 * Displays pie chart component from a per-team percentage dataset.
 *
 * @public
 */
const GroupDivisionStatisticsPieChart = () => {
  const theme = useTheme();
  // const apiResult = useStatistics([{team: props.teamName}]);
  const apiResult = useGroupDivisionStatistics();
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }
    const teamNames = getUniqueTeamsFromStatistics(
      items as GroupSavingsDivision[],
    );
    const backgroundColors = generateBackgroundColorSet(teamNames.length);
    const hoverBackgroundColors = generateBackgroundColorSet(teamNames.length);
    const datasets = buildDatasetsFromPieChart(
      items,
      backgroundColors,
      hoverBackgroundColors,
    );

    return (
      <PieChartTemplate
        options={getPieChartOptions(theme, 'Team Percentage Distribution')}
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
export default GroupDivisionStatisticsPieChart;
