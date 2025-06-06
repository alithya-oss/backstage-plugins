## API Report File for "@alithya-oss/backstage-plugin-time-saver"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
import { BackstagePlugin } from '@backstage/core-plugin-api';
import { DiscoveryApi } from '@backstage/core-plugin-api';
import { FetchApi } from '@backstage/core-plugin-api';
import { GetAllGroupsResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetAllStatsResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetAllTemplateNamesResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetAllTemplateTasksResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetDailyTimeSummariesByTeamResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetDailyTimeSummariesByTemplateResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetGroupDivisionStatsResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetStatsByTeamResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetStatsByTemplateResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetStatsByTemplateTaskIdResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetTemplateCountResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetTimeSavedSummaryByTeamResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetTimeSavedSummaryByTemplateResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetTimeSavedSumResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { GetUriParams } from '@alithya-oss/backstage-plugin-time-saver-common';
import { IdentityApi } from '@backstage/core-plugin-api';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { RouteRef } from '@backstage/core-plugin-api';
import { TimeSaverApi } from '@alithya-oss/backstage-plugin-time-saver-react';

// @public
export class TimeSaverClient implements TimeSaverApi {
  constructor(options: {
    fetchApi: FetchApi;
    identityApi: IdentityApi;
    discoveryApi: DiscoveryApi;
  });
  // (undocumented)
  getDailyTimeSummaryPerTeam(): Promise<GetDailyTimeSummariesByTeamResponse>;
  // (undocumented)
  getDailyTimeSummaryPerTemplate(): Promise<GetDailyTimeSummariesByTemplateResponse>;
  // (undocumented)
  getGroupDivisionsStatistics(): Promise<GetGroupDivisionStatsResponse>;
  // (undocumented)
  getStatistics(
    params?: GetUriParams,
  ): Promise<
    | GetAllStatsResponse
    | GetStatsByTeamResponse
    | GetStatsByTemplateResponse
    | GetStatsByTemplateTaskIdResponse
  >;
  // (undocumented)
  getTeams(): Promise<GetAllGroupsResponse>;
  // (undocumented)
  getTemplateCount(): Promise<GetTemplateCountResponse>;
  // (undocumented)
  getTemplates(): Promise<GetAllTemplateNamesResponse>;
  // (undocumented)
  getTemplateTasks(): Promise<GetAllTemplateTasksResponse>;
  // (undocumented)
  getTimeSavedSum(params?: GetUriParams): Promise<GetTimeSavedSumResponse>;
  // (undocumented)
  getTimeSummaryPerTeam(): Promise<GetTimeSavedSummaryByTeamResponse>;
  // (undocumented)
  getTimeSummaryPerTemplate(): Promise<GetTimeSavedSummaryByTemplateResponse>;
}

// @public (undocumented)
export const TimeSaverPage: () => JSX_2.Element;

// @public (undocumented)
export const TimeSaverPlugin: BackstagePlugin<
  {
    root: RouteRef<undefined>;
  },
  {},
  {}
>;

// @public (undocumented)
export const TimeSaverSamplesPage: () => JSX_2.Element;

// (No @packageDocumentation comment for this package)
```
