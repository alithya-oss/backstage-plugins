import {
  DiscoveryApi,
  FetchApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { TimeSaverApi } from '@alithya-oss/plugin-time-saver-react';
import { ResponseError } from '@backstage/errors';
import {
  GetUriParams,
  GetAllStatsResponse,
  GetStatsByTeamResponse,
  GetStatsByTemplateResponse,
  GetStatsByTemplateTaskIdResponse,
  GetDailyTimeSummariesByTeamResponse,
  GetDailyTimeSummariesByTemplateResponse,
  GetTimeSavedSummaryByTeamResponse,
  GetTimeSavedSummaryByTemplateResponse,
  GetTimeSavedSumResponse,
  GetTemplateCountResponse,
  GetAllGroupsResponse,
  GetAllTemplateNamesResponse,
  GetAllTemplateTasksResponse,
  GetGroupDivisionStatsResponse,
} from '@alithya-oss/plugin-time-saver-common';

/**
 * Time Saver API client
 *
 * @public
 */
export class TimeSaverClient implements TimeSaverApi {
  private readonly fetchApi: FetchApi;
  private readonly identityApi: IdentityApi;
  private readonly discoveryApi: DiscoveryApi;

  public constructor(options: {
    fetchApi: FetchApi;
    identityApi: IdentityApi;
    discoveryApi: DiscoveryApi;
  }) {
    this.fetchApi = options.fetchApi;
    this.identityApi = options.identityApi;
    this.discoveryApi = options.discoveryApi;
  }

  private async get<T>(
    uriSegment: string,
    params?: { [key in string]: any },
  ): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl('time-saver')}`;
    const { token: idToken } = await this.identityApi.getCredentials();
    const url = `${baseUrl}/${uriSegment}?${
      params ? new URLSearchParams(params).toString() : ''
    }`;

    const response = await this.fetchApi.fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(idToken && { Authorization: `Bearer ${idToken}` }),
      },
    });
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return response.json() as Promise<T>;
  }

  public async getTeams(): Promise<GetAllGroupsResponse> {
    return await this.get<GetAllGroupsResponse>('groups');
  }

  public async getTemplates(): Promise<GetAllTemplateNamesResponse> {
    return await this.get<GetAllTemplateNamesResponse>('templates');
  }

  public async getTemplateTasks(): Promise<GetAllTemplateTasksResponse> {
    return await this.get<GetAllTemplateTasksResponse>('templateTasks');
  }

  public async getTemplateCount(): Promise<GetTemplateCountResponse> {
    return await this.get<GetTemplateCountResponse>('getTemplateCount');
  }

  public async getTimeSavedSum(
    params?: GetUriParams,
  ): Promise<GetTimeSavedSumResponse> {
    return await this.get<GetTimeSavedSumResponse>('getTimeSavedSum', params);
  }

  public async getStatistics(
    params?: GetUriParams,
  ): Promise<
    | GetAllStatsResponse
    | GetStatsByTeamResponse
    | GetStatsByTemplateResponse
    | GetStatsByTemplateTaskIdResponse
  > {
    if (params) {
      if ('team' in Object.keys(params)) {
        return await this.get<GetStatsByTeamResponse>('getStats', params);
      } else if ('template' in Object.keys(params)) {
        return await this.get<GetStatsByTemplateResponse>('getStats', params);
      } else if ('templateTaskId' in Object.keys(params)) {
        return await this.get<GetStatsByTemplateTaskIdResponse>(
          'getStats',
          params,
        );
      }
    }

    return await this.get<GetAllStatsResponse>('getStats');
  }

  public async getGroupDivisionsStatistics(): Promise<GetGroupDivisionStatsResponse> {
    return await this.get<GetGroupDivisionStatsResponse>('/getStats/group');
  }

  public async getDailyTimeSummaryPerTeam(): Promise<GetDailyTimeSummariesByTeamResponse> {
    return await this.get<GetDailyTimeSummariesByTeamResponse>(
      'getDailyTimeSummary/team',
    );
  }

  public async getDailyTimeSummaryPerTemplate(): Promise<GetDailyTimeSummariesByTemplateResponse> {
    return await this.get<GetDailyTimeSummariesByTemplateResponse>(
      'getDailyTimeSummary/template',
    );
  }

  public async getTimeSummaryPerTeam(): Promise<GetTimeSavedSummaryByTeamResponse> {
    return await this.get<GetTimeSavedSummaryByTeamResponse>(
      'getTimeSummary/team',
    );
  }

  public async getTimeSummaryPerTemplate(): Promise<GetTimeSavedSummaryByTemplateResponse> {
    return await this.get<GetTimeSavedSummaryByTemplateResponse>(
      'getTimeSummary/template',
    );
  }
}
