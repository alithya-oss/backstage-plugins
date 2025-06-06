## API Report File for "@alithya-oss/backstage-plugin-time-saver-react"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts
/// <reference types="react" />

import { ApiRef } from '@backstage/core-plugin-api';
import { AutocompleteChangeDetails } from '@mui/material/Autocomplete';
import { AutocompleteChangeReason } from '@mui/material/Autocomplete';
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
import { GridCallbackDetails } from '@mui/x-data-grid';
import { GridColDef } from '@mui/x-data-grid';
import { GridRowsProp } from '@mui/x-data-grid';
import { GridSortModel } from '@mui/x-data-grid';
import { GroupSavingsDivision } from '@alithya-oss/backstage-plugin-time-saver-common';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { TimeSavedStatistics } from '@alithya-oss/backstage-plugin-time-saver-common';
import { TimeSavedStatisticsByTeamName } from '@alithya-oss/backstage-plugin-time-saver-common';
import { TimeSavedStatisticsByTemplateName } from '@alithya-oss/backstage-plugin-time-saver-common';
import { TimeSaverApiErrorResponse } from '@alithya-oss/backstage-plugin-time-saver-common';
import { TimeSummaryByTeamName } from '@alithya-oss/backstage-plugin-time-saver-common';
import { TimeSummaryByTemplateName } from '@alithya-oss/backstage-plugin-time-saver-common';

// @public
export const AllStatisticsBarChart: () => JSX_2.Element;

// @public
export function AutocompleteTemplate(
  props: AutocompleteTemplateProps,
): JSX_2.Element;

// @public
export interface AutocompleteTemplateProps {
  // (undocumented)
  label?: string;
  // (undocumented)
  onChangeHandler: (
    event: React.SyntheticEvent,
    value: string | null,
    reason?: AutocompleteChangeReason,
    details?: AutocompleteChangeDetails<string | null>,
  ) => void;
  // (undocumented)
  options?: string[];
}

// @public
export const BarChartTemplate: (props: BarChartTemplateProps) => JSX_2.Element;

// @public
export interface BarChartTemplateProps {
  // (undocumented)
  data: any;
  // (undocumented)
  options: any;
}

// @public
export const DailyTimeSummaryPerTeamLineChart: (
  props: DailyTimeSummaryPerTeamLineChartProps,
) => JSX_2.Element;

// @public
export interface DailyTimeSummaryPerTeamLineChartProps {
  // (undocumented)
  teamName?: string;
}

// @public
export const DailyTimeSummaryPerTemplateLineChart: (
  props: DailyTimeSummaryPerTemplateLineChartProps,
) => JSX_2.Element;

// @public
export interface DailyTimeSummaryPerTemplateLineChartProps {
  // (undocumented)
  templateName?: string;
}

// @public
export function GaugeTemplate(props: GaugeTemplateProps): JSX_2.Element;

// @public
export interface GaugeTemplateProps {
  // (undocumented)
  avatarColor?: string;
  // (undocumented)
  data?: number;
  // (undocumented)
  heading?: string;
}

// @public
export const GroupDivisionStatisticsPieChart: () => JSX_2.Element;

// @public
export const LineChartTemplate: (
  props: LineChartTemplateProps,
) => JSX_2.Element;

// @public
export interface LineChartTemplateProps {
  // (undocumented)
  data: any;
  // (undocumented)
  options: any;
}

// @public
export const PieChartTemplate: (props: PieChartTemplateProps) => JSX_2.Element;

// @public
export interface PieChartTemplateProps {
  // (undocumented)
  data: any;
  // (undocumented)
  options: any;
}

// @public
export function SelectorTemplate(props: SelectorTemplateProps): JSX_2.Element;

// @public
export interface SelectorTemplateProps {
  // (undocumented)
  defaultValue: string;
  // (undocumented)
  handleChange?: (
    event: React.ChangeEvent<{
      name?: string;
      value: unknown;
    }>,
    child: React.ReactNode,
  ) => void;
  // (undocumented)
  handleClearClick?: React.MouseEventHandler<HTMLButtonElement>;
  // (undocumented)
  items: string[];
  // (undocumented)
  label: string;
  // (undocumented)
  onClearButtonClick?: boolean;
}

// @public
export const StatisticsTable: (props: StatisticsTableProps) => JSX_2.Element;

// @public
export interface StatisticsTableProps {
  // (undocumented)
  teamName?: string;
  // (undocumented)
  templateName?: string;
}

// @public
export function TableTemplate(props: TableTemplateProps): JSX_2.Element;

// @public
export interface TableTemplateProps {
  // (undocumented)
  columns: GridColDef[];
  // (undocumented)
  onSortModelChange: (
    model: GridSortModel,
    details: GridCallbackDetails,
  ) => void;
  // (undocumented)
  rows?: GridRowsProp;
  // (undocumented)
  sortModel?: GridSortModel;
}

// @public
export const TeamCountGauge: () => JSX_2.Element;

// @public
export const TeamSelector: (props: TeamSelectorProps) => JSX_2.Element;

// @public
export interface TeamSelectorProps {
  // (undocumented)
  onClearButtonClick?: () => void;
  // (undocumented)
  onTeamChange: (team: string) => void;
}

// @public
export const TeamStatisticsBarChart: (
  props: TeamStatisticsBarChartProps,
) => JSX_2.Element;

// @public
export interface TeamStatisticsBarChartProps {
  // (undocumented)
  teamName: string;
}

// @public
export const TemplateCountGauge: () => JSX_2.Element;

// @public
export const TemplateExecutionsCountGauge: () => JSX_2.Element;

// @public
export const TemplateNameAutocomplete: (
  props: TemplateNameAutocompleteProps,
) => JSX_2.Element;

// @public
export interface TemplateNameAutocompleteProps {
  // (undocumented)
  onTemplateChange: (templateUsed: string) => void;
}

// @public
export const TemplateStatisticsBarChart: (
  props: TemplateStatisticsBarChartProps,
) => JSX_2.Element;

// @public
export interface TemplateStatisticsBarChartProps {
  // (undocumented)
  templateName: string;
}

// @public
export const TimeSavedGauge: (props: TimeSavedGaugeProps) => JSX_2.Element;

// @public
export interface TimeSavedGaugeProps {
  // (undocumented)
  divider?: number;
  // (undocumented)
  label?: string;
}

// @public
export interface TimeSaverApi {
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

// @public
export const timeSaverApiRef: ApiRef<TimeSaverApi>;

// @public
export const TimeSummaryPerTeamLineChart: (
  props: TimeSummaryPerTeamLineChartProps,
) => JSX_2.Element;

// @public
export interface TimeSummaryPerTeamLineChartProps {
  // (undocumented)
  teamName?: string;
}

// @public
export const TimeSummaryPerTemplateLineChart: (
  props: TimeSummaryPerTemplateLineChartProps,
) => JSX_2.Element;

// @public
export interface TimeSummaryPerTemplateLineChartProps {
  // (undocumented)
  templateName?: string;
}

// @public
export function useDailyTimeSummaryPerTeam(): {
  items?: TimeSummaryByTeamName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useDailyTimeSummaryPerTemplate(): {
  items?: TimeSummaryByTemplateName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useGroupDivisionStatistics(): {
  items?: GroupSavingsDivision[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useStatistics(params?: GetUriParams): {
  items?:
    | TimeSavedStatistics[]
    | TimeSavedStatisticsByTeamName[]
    | TimeSavedStatisticsByTemplateName[]
    | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTeams(): {
  items?: string[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTemplateCount(): {
  items?: number | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTemplates(): {
  items?: string[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTemplateTasks(): {
  items?: string[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTimeSavedSum(params?: GetUriParams): {
  items?: number | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTimeSummaryPerTeam(): {
  items?: TimeSummaryByTeamName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};

// @public
export function useTimeSummaryPerTemplate(): {
  items?: TimeSummaryByTemplateName[] | TimeSaverApiErrorResponse;
  loading: boolean;
  error?: Error;
};
```
