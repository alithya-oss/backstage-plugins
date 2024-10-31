import { DateTime } from 'luxon';

/**
 * @public
 */
export type TemplateTimeSavings = {
  id?: string;
  team: string;
  role: string;
  createdAt: DateTime;
  createdBy: string;
  timeSaved: number;
  templateName: string;
  templateTaskId: string;
  templateTaskStatus: string;
};

/**
 * @public
 */
export type TemplateTimeSavingsCollection = TemplateTimeSavings[];

/**
 * @public
 */
export type TemplateTimeSavingsDbRow = {
  id?: string;
  team: string;
  role: string;
  created_at: string;
  created_by: string;
  time_saved: number;
  template_name: string;
  template_task_id: string;
  template_task_status: string;
};

/**
 * @public
 */
export type TimeSavedStatisticsDbRow = {
  team: string;
  template_name: string;
  time_saved: string | undefined;
};

/**
 * @public
 */
export type TimeSavedStatisticsByTeamNameDbRow = Omit<
  TimeSavedStatisticsDbRow,
  'template_name'
>;

/**
 * @public
 */
export type TimeSavedStatisticsByTemplateNameDbRow = Omit<
  TimeSavedStatisticsDbRow,
  'team'
>;

/**
 * @public
 */
export type TimeSavedStatistics = {
  team: string;
  templateName: string;
  timeSaved: number;
};

/**
 * @public
 */
export type TimeSavedStatisticsByTeamName = Omit<
  TimeSavedStatistics,
  'templateName'
>;

/**
 * @public
 */
export type TimeSavedStatisticsByTemplateName = Omit<
  TimeSavedStatistics,
  'team'
>;

/**
 * @public
 */
export type GroupSavingsDivisionDbRow = {
  team: string;
  total_time_saved: number;
  percentage: number;
};

/**
 * @public
 */
export type GroupSavingsDivision = {
  team: string;
  percentage: number;
};

/**
 * @public
 */
export type TimeSummaryDbRow = {
  team: string;
  template_name: string;
  date?: string;
  total_time_saved?: number;
};

/**
 * @public
 */
export type TimeSummaryByTemplateNameDbRow = Omit<TimeSummaryDbRow, 'team'>;

/**
 * @public
 */
export type TimeSummaryByTeamNameDbRow = Omit<
  TimeSummaryDbRow,
  'template_name'
>;

/**
 * @public
 */
export type TimeSummary = {
  team: string;
  templateName: string;
  date: DateTime;
  totalTimeSaved: number;
};

/**
 * @public
 */
export type TimeSummaryByTemplateName = Omit<TimeSummary, 'team'>;

/**
 * @public
 */
export type TimeSummaryByTeamName = Omit<TimeSummary, 'templateName'>;

/**
 * @public
 */
export type TemplateCountDbRow = {
  count: number;
};

/**
 * @public
 */
export type TotalTimeSavedDbRow = {
  sum: number;
};

/**
 * @public
 */
export type DatabaseErrorResponse = {
  errorMessage: string;
};

/**
 * @public
 */
export type GetAllStatsResponse = {
  stats: TimeSavedStatistics[];
};

/**
 * @public
 */
export type GetStatsByTemplateResponse = {
  templateName: string;
  stats: TimeSavedStatisticsByTeamName[];
};

/**
 * @public
 */
export type GetStatsByTeamResponse = {
  team: string;
  stats: TimeSavedStatisticsByTemplateName[];
};

/**
 * @public
 */
export type GetStatsByTemplateTaskIdResponse = {
  templateTaskId: string;
  templateName: string;
  stats: TimeSavedStatisticsByTeamName[];
};

/**
 * @public
 */
export type GetGroupDivisionStatsResponse = {
  stats: GroupSavingsDivision[];
};

/**
 * @public
 */
export type GetDailyTimeSummariesByTeamResponse = {
  stats: TimeSummaryByTeamName[];
};

/**
 * @public
 */
export type GetDailyTimeSummariesByTemplateResponse = {
  stats: TimeSummaryByTemplateName[];
};

/**
 * @public
 */
export type GetTimeSavedSummaryByTeamResponse = {
  stats: TimeSummaryByTeamName[];
};

/**
 * @public
 */
export type GetTimeSavedSummaryByTemplateResponse = {
  stats: TimeSummaryByTemplateName[];
};

/**
 * @public
 */
export type GetAllGroupsResponse = {
  groups: string[];
};

/**
 * @public
 */
export type GetAllTemplateNamesResponse = {
  templates: string[];
};

/**
 * @public
 */
export type GetAllTemplateTasksResponse = {
  templateTasks: string[];
};

/**
 * @public
 */
export type GetTemplateCountResponse = {
  count: number;
};

/**
 * @public
 */
export type GetTimeSavedSumResponse = {
  timeSaved: number;
};

/**
 * @public
 */
export type TimeSaverApiErrorResponse = {
  errorMessage: string;
};
