import {
  roundNumericValues,
  isoDateFromDateTime,
  dateTimeFromIsoDate,
} from '../utils';
import {
  GroupSavingsDivision,
  GroupSavingsDivisionDbRow,
  TemplateTimeSavingsDbRow,
  TimeSavedStatisticsDbRow,
  TimeSummaryByTeamNameDbRow,
  TemplateTimeSavings,
  TimeSummaryByTeamName,
  TemplateTimeSavingsCollection,
  TimeSummaryByTemplateNameDbRow,
  TimeSummaryByTemplateName,
  isTimeSavedStatisticsPerTeamDbRow,
  isTimeSavedStatisticsPerTemplateNameDbRow,
  TimeSavedStatisticsByTeamNameDbRow,
  TimeSavedStatisticsByTemplateNameDbRow,
  isTimeSavedStatisticsDbRow,
} from '@alithya-oss/backstage-plugin-time-saver-common';

const DEFAULT_DB_CREATED_AT_VALUE = '';

export class TemplateTimeSavingsMap {
  static toPersistence(
    templateTimeSavings: TemplateTimeSavings,
  ): TemplateTimeSavingsDbRow {
    return {
      team: templateTimeSavings.team,
      role: templateTimeSavings.role,
      created_at:
        isoDateFromDateTime(templateTimeSavings.createdAt) ||
        DEFAULT_DB_CREATED_AT_VALUE,
      created_by: templateTimeSavings.createdBy,
      time_saved: templateTimeSavings.timeSaved,
      template_name: templateTimeSavings.templateName,
      template_task_id: templateTimeSavings.templateTaskId,
      template_task_status: templateTimeSavings.templateTaskStatus,
    };
  }
  static toDTO(
    templateTimeSavingsDbRow: TemplateTimeSavingsDbRow,
  ): TemplateTimeSavings {
    return {
      id: templateTimeSavingsDbRow.id,
      team: templateTimeSavingsDbRow.team,
      role: templateTimeSavingsDbRow.role,
      createdAt: dateTimeFromIsoDate(templateTimeSavingsDbRow.created_at),
      createdBy: templateTimeSavingsDbRow.created_by,
      timeSaved: roundNumericValues(templateTimeSavingsDbRow.time_saved),
      templateName: templateTimeSavingsDbRow.template_name,
      templateTaskId: templateTimeSavingsDbRow.template_task_id,
      templateTaskStatus: templateTimeSavingsDbRow.template_task_status,
    };
  }
}

export class TemplateTimeSavingsCollectionMap {
  static toDTO(
    templateTimeSavingsDbRows: TemplateTimeSavingsDbRow[],
  ): TemplateTimeSavingsCollection {
    return templateTimeSavingsDbRows.map(e => TemplateTimeSavingsMap.toDTO(e));
  }
  static distinctToDTO(
    templateTimeSavingsDbRows: Partial<TemplateTimeSavingsDbRow>[],
  ): { [x: string]: (string | number)[] } | undefined {
    if (!(templateTimeSavingsDbRows && templateTimeSavingsDbRows.length)) {
      return undefined;
    }
    const key: string = Object.keys(templateTimeSavingsDbRows[0])[0];
    const values = templateTimeSavingsDbRows.map(e => Object.values(e)[0]);

    return {
      [key]: [...values],
    };
  }
}

export class TimeSavedStatisticsMap {
  static toDTO<T>(
    timeSavedStatisticsDbRow:
      | TimeSavedStatisticsByTeamNameDbRow
      | TimeSavedStatisticsByTemplateNameDbRow
      | TimeSavedStatisticsDbRow,
  ): T {
    if (isTimeSavedStatisticsDbRow(timeSavedStatisticsDbRow)) {
      return {
        team: timeSavedStatisticsDbRow.team,
        templateName: timeSavedStatisticsDbRow.template_name,
        timeSaved: parseInt(timeSavedStatisticsDbRow.time_saved || '0', 10),
      } as T;
    } else if (isTimeSavedStatisticsPerTeamDbRow(timeSavedStatisticsDbRow)) {
      return {
        team: timeSavedStatisticsDbRow.team,
        timeSaved: parseInt(timeSavedStatisticsDbRow.time_saved || '0', 10),
      } as T;
    } else if (
      isTimeSavedStatisticsPerTemplateNameDbRow(timeSavedStatisticsDbRow)
    ) {
      return {
        templateName: timeSavedStatisticsDbRow.template_name,
        timeSaved: parseInt(timeSavedStatisticsDbRow.time_saved || '0', 10),
      } as T;
    }

    throw new Error('Wrong type');
  }
}

export class GroupSavingsDivisionMap {
  static toDTO(
    groupSavingsDivisionDbRow: GroupSavingsDivisionDbRow,
  ): GroupSavingsDivision {
    return {
      team: groupSavingsDivisionDbRow?.team,
      percentage: roundNumericValues(groupSavingsDivisionDbRow.percentage),
    };
  }
}

export class TimeSummaryMap {
  static timeSummaryByTeamNameToDTO(
    timeSummaryDbRow: TimeSummaryByTeamNameDbRow,
  ): TimeSummaryByTeamName {
    return {
      team: timeSummaryDbRow.team,
      date: dateTimeFromIsoDate(timeSummaryDbRow.date),
      totalTimeSaved:
        roundNumericValues(timeSummaryDbRow.total_time_saved) || 0,
    };
  }

  static timeSummaryByTemplateNameToDTO(
    timeSummaryDbRow: TimeSummaryByTemplateNameDbRow,
  ): TimeSummaryByTemplateName {
    return {
      templateName: timeSummaryDbRow.template_name,
      date: dateTimeFromIsoDate(timeSummaryDbRow.date),
      totalTimeSaved:
        roundNumericValues(timeSummaryDbRow.total_time_saved) || 0,
    };
  }
}
