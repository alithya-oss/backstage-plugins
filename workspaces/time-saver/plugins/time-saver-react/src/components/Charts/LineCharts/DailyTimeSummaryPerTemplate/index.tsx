import LineChartTemplate from '../LineChartTemplate';
import { useDailyTimeSummaryPerTemplate } from '../../../../hooks';
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
 * Props for {@link DailyTimeSummaryPerTemplateLineChart}.
 *
 * @public
 */
export interface DailyTimeSummaryPerTemplateLineChartProps {
  templateName?: string;
}

/**
 * Displays a line chart component using daily time saved per template data.
 *
 * @remarks
 *
 * Longer descriptions should be put after the `@remarks` tag. That way the initial summary
 * will show up in the API docs overview section, while the longer description will only be
 * displayed on the page for the specific API.
 *
 * @public
 */
const DailyTimeSummaryPerTemplateLineChart = (
  props: DailyTimeSummaryPerTemplateLineChartProps,
) => {
  const theme = useTheme();
  const apiResult = useDailyTimeSummaryPerTemplate();
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
        options={getLineChartOptions(theme, 'Daily Time Summary by Template')}
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
export default DailyTimeSummaryPerTemplateLineChart;
