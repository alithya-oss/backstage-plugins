import {
  GroupSavingsDivision,
  TimeSummaryByTeamName,
  TimeSummaryByTemplateName,
} from '@alithya-oss/plugin-time-saver-common';
import { Theme } from '@material-ui/core';
import { ChartOptions } from 'chart.js';
import { getRandomColor } from '../utils';
import { DateTime } from 'luxon';

export const getBarChartOptions = (
  theme: Theme,
  title: string = '',
): ChartOptions<'bar'> => ({
  plugins: {
    title: {
      display: true,
      text: title || '',
      color: theme.palette.text.primary,
    },
    legend: {
      display: true,
      labels: {
        color: theme.palette.text.primary,
      },
    },
  },
  responsive: true,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
      grid: {
        display: true,
      },
      ticks: {
        color: theme.palette.text.primary,
      },
    },
    y: {
      stacked: true,
      grid: {
        display: true,
      },
      ticks: {
        color: theme.palette.text.primary,
      },
    },
  },
});

export const getLineChartOptions = (
  theme: Theme,
  title: string = '',
): ChartOptions<'line'> => ({
  plugins: {
    title: {
      display: true,
      text: title || '',
      color: theme.palette.text.primary,
    },
  },
  responsive: true,
  scales: {
    x: [
      {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'YYYY-MM-DD',
          displayFormats: {
            day: 'YYYY-MM-DD',
          },
          bounds: 'data',
        },
        scaleLabel: {
          display: true,
          labelString: 'Date',
        },
      },
    ] as unknown as ChartOptions<'line'>['scales'],
    y: [
      {
        stacked: true,
        beginAtZero: true,
        scaleLabel: {
          display: true,
          labelString: 'Total Time Saved',
        },
      },
    ] as unknown as ChartOptions<'line'>['scales'],
  },
});

export const getPieChartOptions = (
  theme: Theme,
  title: string = '',
): ChartOptions<'pie'> => ({
  plugins: {
    legend: {
      labels: {
        color: theme.palette.text.primary,
      },
    },
    title: {
      display: true,
      text: title,
      color: theme.palette.text.primary,
    },
  },
  responsive: true,
});

export function getUniqueTeamsFromStatistics(stats: { team: string }[]) {
  return Array.from(new Set(stats.map(stat => stat.team)));
}

export function getUniqueTemplateNamesFromStatistics(
  stats: { templateName: string }[],
) {
  return Array.from(new Set(stats.map(stat => stat.templateName)));
}

export function generateBackgroundColorSet(length: number) {
  return Array.from({ length }, () => getRandomColor());
}

export function getTotalTimeSavedFromStatistics(stats: { sum: number }[]) {
  return stats.map(stat => stat.sum);
}

export function buildDatasetsFromStatistics(
  templateNames: string[],
  labels: string[],
  statistics: any,
  backgroundColors: string[],
) {
  return templateNames.map((templateName, index) => ({
    label: `Time Saved - ${templateName}`,
    data: labels.map(team =>
      statistics
        .filter(
          (stat: { team: string; templateName: string }) =>
            stat.team === team && stat.templateName === templateName,
        )
        .reduce(
          (sum: number, stat: { timeSaved: number }) => sum + stat.timeSaved,
          0,
        ),
    ),
    backgroundColor: backgroundColors[index],
  }));
}

export function buildIndividualStatisticsDataset(
  label: string,
  statistics: any,
  backgroundColors: string[],
) {
  return [
    {
      label,
      data: statistics.map((stat: { timeSaved: number }) => stat.timeSaved),
      backgroundColor: backgroundColors,
    },
  ];
}

export function getSetFromStatistics<T>(statistics: T[], key: keyof T) {
  return Array.from(new Set(statistics.map(stat => stat[key])));
}

export function getDatesFromStatistics(
  statistics: { date: DateTime | string }[],
) {
  return getSetFromStatistics<{ date: DateTime | string }>(statistics, 'date');
}

export function buildTimeSummaryPerTeamDataset(
  uniqueTeams: string[],
  statistics: (Pick<TimeSummaryByTeamName, 'team' | 'totalTimeSaved'> & {
    date: DateTime | string;
  })[],
) {
  return uniqueTeams.map(teamName => {
    const templateData = statistics
      .filter(stat => stat.team === teamName)
      .map(stat => ({ x: stat.date, y: stat.totalTimeSaved }));

    return {
      label: teamName,
      data: templateData,
      fill: false,
      borderColor: getRandomColor(),
    };
  });
}

export function buildTimeSummaryPerTemplateDataset(
  uniqueTemplates: string[],
  statistics: (Pick<
    TimeSummaryByTemplateName,
    'templateName' | 'totalTimeSaved'
  > & { date: DateTime | string })[],
) {
  return uniqueTemplates.map(templateName => {
    const templateData = statistics
      .filter(stat => stat.templateName === templateName)
      .map(stat => ({ x: stat.date, y: stat.totalTimeSaved }));

    return {
      label: templateName,
      data: templateData,
      fill: false,
      borderColor: getRandomColor(),
    };
  });
}

export function buildDatasetsFromPieChart(
  statistics: GroupSavingsDivision[],
  backgroundColors: string[],
  hoverBackgroundColors: string[],
) {
  return [
    {
      data: statistics.map(stat => stat.percentage),
      backgroundColors,
      hoverBackgroundColors,
    },
  ];
}
