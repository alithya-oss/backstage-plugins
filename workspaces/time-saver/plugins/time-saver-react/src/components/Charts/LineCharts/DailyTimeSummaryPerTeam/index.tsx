import LineChartTemplate from '../LineChartTemplate';
import { useDailyTimeSummaryPerTeam } from '../../../../hooks';
import { isTimeSaverApiError } from '@alithya-oss/backstage-plugin-time-saver-common';
import {
  getLineChartOptions,
  buildTimeSummaryPerTeamDataset,
  getUniqueTeamsFromStatistics,
  getDatesFromStatistics,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';
import { DateTime } from 'luxon';

/**
 * Props for {@link DailyTimeSummaryPerTeamLineChart}.
 *
 * @public
 */
export interface DailyTimeSummaryPerTeamLineChartProps {
  teamName?: string;
}

/**
 * Displays a line chart component using daily time saved per team data.
 *
 * @public
 */
const DailyTimeSummaryPerTeamLineChart = (
  props: DailyTimeSummaryPerTeamLineChartProps,
) => {
  const theme = useTheme();
  const apiResult = useDailyTimeSummaryPerTeam();
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
    const filteredItems = props.teamName
      ? items
          .filter(stat => stat.team === props.teamName)
          .map(stat => ({
            ...stat,
            date: DateTime.fromISO(stat.date.toString()).toFormat('yyyy-MM-dd'),
          }))
      : items.map(stat => ({
          ...stat,
          date: DateTime.fromISO(stat.date.toString()).toFormat('yyyy-MM-dd'),
        }));

    const teamNames = getUniqueTeamsFromStatistics(filteredItems);
    const uniqueDates = getDatesFromStatistics(filteredItems);
    const datasets = buildTimeSummaryPerTeamDataset(teamNames, filteredItems);

    return (
      <LineChartTemplate
        options={getLineChartOptions(theme, 'Daily Time Summary by Team')}
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
export default DailyTimeSummaryPerTeamLineChart;
