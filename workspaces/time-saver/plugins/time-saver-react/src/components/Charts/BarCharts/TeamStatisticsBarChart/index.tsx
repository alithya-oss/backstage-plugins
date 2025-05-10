import BarChartTemplate from '../BarChartTemplate';
import { useStatistics } from '../../../../hooks';
import {
  isTimeSaverApiError,
  TimeSavedStatistics,
} from '@alithya-oss/backstage-plugin-time-saver-common';
import {
  getUniqueTemplateNamesFromStatistics,
  generateBackgroundColorSet,
  getBarChartOptions,
  buildIndividualStatisticsDataset,
} from '../../utils';
import { CircularProgress, useTheme } from '@material-ui/core';

/**
 * Props for {@link TeamStatisticsBarChart}.
 *
 * @public
 */
export interface TeamStatisticsBarChartProps {
  teamName: string;
}

/**
 * Displays a team's statistic's bar chart component.
 *
 * @public
 */
const TeamStatisticsBarChart = (props: TeamStatisticsBarChartProps) => {
  const theme = useTheme();
  const apiResult = useStatistics({ team: props.teamName });
  const { loading, error, items } = apiResult;

  if (!!items) {
    if (isTimeSaverApiError(items)) {
      return <>Time Saver Api Error</>;
    }
    const templateNames = getUniqueTemplateNamesFromStatistics(
      items as TimeSavedStatistics[],
    );
    const backgroundColors = generateBackgroundColorSet(templateNames.length);
    const datasets = buildIndividualStatisticsDataset(
      'Time Saved',
      items,
      backgroundColors,
    );

    return (
      <BarChartTemplate
        options={getBarChartOptions(theme, props.teamName)}
        data={{
          labels: templateNames,
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
export default TeamStatisticsBarChart;
