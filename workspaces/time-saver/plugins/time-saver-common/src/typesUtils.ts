import {
  GetAllTemplateTasksResponse,
  DatabaseErrorResponse,
  TimeSavedStatisticsByTeamNameDbRow,
  TimeSavedStatisticsByTemplateNameDbRow,
  TimeSavedStatisticsDbRow,
} from './types';

export function isTemplateTaskResponse(
  templateTasksResponse: GetAllTemplateTasksResponse | DatabaseErrorResponse,
): templateTasksResponse is GetAllTemplateTasksResponse {
  return (
    (templateTasksResponse as GetAllTemplateTasksResponse).templateTasks !==
    undefined
  );
}

export function isTimeSavedStatisticsPerTeamDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsByTeamNameDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsByTeamNameDbRow).team !==
    undefined
  );
}

export function isTimeSavedStatisticsPerTemplateNameDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsByTemplateNameDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsByTemplateNameDbRow)
      .template_name !== undefined
  );
}

export function isTimeSavedStatisticsDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsDbRow).team !== undefined &&
    (timeSavedStatistics as TimeSavedStatisticsDbRow).template_name !==
      undefined
  );
}
