import { createApiRef } from '@backstage/core-plugin-api';
import {
  GetUriParams,
  GetAllGroupsResponse,
  GetAllTemplateNamesResponse,
  GetAllTemplateTasksResponse,
  GetTemplateCountResponse,
  GetTimeSavedSumResponse,
  GetAllStatsResponse,
  GetStatsByTeamResponse,
  GetStatsByTemplateResponse,
  GetStatsByTemplateTaskIdResponse,
  GetTimeSavedSummaryByTeamResponse,
  GetTimeSavedSummaryByTemplateResponse,
  GetDailyTimeSummariesByTeamResponse,
  GetDailyTimeSummariesByTemplateResponse,
  GetGroupDivisionStatsResponse,
} from '@alithya-oss/backstage-plugin-time-saver-common';

/**
 * TimeSaverApi interface.
 *
 * @public
 */
export interface TimeSaverApi {
  getTeams(): Promise<GetAllGroupsResponse>;
  getTemplates(): Promise<GetAllTemplateNamesResponse>;
  getTemplateTasks(): Promise<GetAllTemplateTasksResponse>;
  getTemplateCount(): Promise<GetTemplateCountResponse>;
  getTimeSavedSum(params?: GetUriParams): Promise<GetTimeSavedSumResponse>;
  getStatistics(
    params?: GetUriParams,
  ): Promise<
    | GetAllStatsResponse
    | GetStatsByTeamResponse
    | GetStatsByTemplateResponse
    | GetStatsByTemplateTaskIdResponse
  >;
  getGroupDivisionsStatistics(): Promise<GetGroupDivisionStatsResponse>;
  getTimeSummaryPerTeam(): Promise<GetTimeSavedSummaryByTeamResponse>;
  getTimeSummaryPerTemplate(): Promise<GetTimeSavedSummaryByTemplateResponse>;
  getDailyTimeSummaryPerTeam(): Promise<GetDailyTimeSummariesByTeamResponse>;
  getDailyTimeSummaryPerTemplate(): Promise<GetDailyTimeSummariesByTemplateResponse>;
}

/**
 * TimeSaverApi reference to communicate with plugin's backend
 *
 * @public
 */
export const timeSaverApiRef = createApiRef<TimeSaverApi>({
  id: 'plugin.time-saver.service',
});
