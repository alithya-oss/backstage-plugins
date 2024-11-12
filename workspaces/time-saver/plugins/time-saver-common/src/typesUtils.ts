import {
  GetAllTemplateTasksResponse,
  DatabaseErrorResponse,
  TimeSavedStatisticsByTeamNameDbRow,
  TimeSavedStatisticsByTemplateNameDbRow,
  TimeSavedStatisticsDbRow,
  TimeSaverApiErrorResponse,
} from './types';

/**
 * @public
 */
export function isTemplateTaskResponse(
  templateTasksResponse: GetAllTemplateTasksResponse | DatabaseErrorResponse,
): templateTasksResponse is GetAllTemplateTasksResponse {
  return (
    (templateTasksResponse as GetAllTemplateTasksResponse).templateTasks !==
    undefined
  );
}

/**
 * @public
 */
export function isTimeSavedStatisticsPerTeamDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsByTeamNameDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsByTeamNameDbRow).team !==
    undefined
  );
}

/**
 * @public
 */
export function isTimeSavedStatisticsPerTemplateNameDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsByTemplateNameDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsByTemplateNameDbRow)
      .template_name !== undefined
  );
}

/**
 * @public
 */
export function isTimeSavedStatisticsDbRow(
  timeSavedStatistics: Partial<TimeSavedStatisticsDbRow>,
): timeSavedStatistics is TimeSavedStatisticsDbRow {
  return (
    (timeSavedStatistics as TimeSavedStatisticsDbRow).team !== undefined &&
    (timeSavedStatistics as TimeSavedStatisticsDbRow).template_name !==
      undefined
  );
}

/**
 * @public
 */
export function isTimeSaverApiError(
  apiResponse: any,
): apiResponse is TimeSaverApiErrorResponse {
  return (apiResponse as TimeSaverApiErrorResponse).errorMessage !== undefined;
}
