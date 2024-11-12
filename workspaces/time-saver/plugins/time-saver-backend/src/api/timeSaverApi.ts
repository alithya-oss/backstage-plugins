/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AuthService,
  LoggerService,
  DiscoveryService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { ScaffolderClient } from './scaffolderClient';
import { ScaffolderStore } from '../database/ScaffolderDatabase';
import { TimeSaverStore } from '../database/TimeSaverDatabase';
import {
  DEFAULT_SAMPLE_CLASSIFICATION,
  DEFAULT_SAMPLE_TEMPLATES_TASKS,
} from './defaultValues';
import {
  GetAllStatsResponse,
  DatabaseErrorResponse,
  GetStatsByTemplateResponse,
  GetStatsByTeamResponse,
  GetStatsByTemplateTaskIdResponse,
  GetGroupDivisionStatsResponse,
  GetDailyTimeSummariesByTeamResponse,
  GetDailyTimeSummariesByTemplateResponse,
  GetTimeSavedSummaryByTeamResponse,
  GetTimeSavedSummaryByTemplateResponse,
  GetAllGroupsResponse,
  GetAllTemplateNamesResponse,
  GetAllTemplateTasksResponse,
  GetTemplateCountResponse,
  GetTimeSavedSumResponse,
  isTemplateTaskResponse,
  TimeSaverApiErrorResponse,
} from '@alithya-oss/plugin-time-saver-common';

export interface TemplateSpecs {
  specs: {
    templateInfo: {
      entity: {
        metadata: {
          substitute: object;
        };
      };
    };
  };
}

export interface SampleMigrationClassificationConfigOptions {
  useScaffolderTasksEntries?: boolean;
}

const TimeSaverApiError = Error;

interface ITimeSaverApiErrorResponse {
  error: Error;
  errorMessage: string;
}

const TemplateTaskIdNotFoundError: ITimeSaverApiErrorResponse = {
  error: TimeSaverApiError('Template task ID not found'),
  errorMessage: 'Template task ID not found',
};
const EmptyDatabaseError: ITimeSaverApiErrorResponse = {
  error: TimeSaverApiError('Plugin database is empty'),
  errorMessage: 'Plugin database is empty',
};
const NoStatisticsFoundError: ITimeSaverApiErrorResponse = {
  error: TimeSaverApiError('No statistics found'),
  errorMessage: 'No statistics found',
};
const DatabaseError: ITimeSaverApiErrorResponse = {
  error: TimeSaverApiError('Database error'),
  errorMessage: 'Database error',
};

export class TimeSaverApi {
  constructor(
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly config: RootConfigService,
    private readonly discovery: DiscoveryService,
    private readonly timeSaverDb: TimeSaverStore,
    private readonly scaffolderDb: ScaffolderStore,
  ) {}

  ok<T>(result: T, logMessage?: string): T {
    this.logger.debug(
      `${logMessage ? `${logMessage} ` : ''}${JSON.stringify(result)}`,
    );
    return result;
  }

  fail(errorResponse: ITimeSaverApiErrorResponse, origin: string = '') {
    const { error, errorMessage } = errorResponse;
    this.logger.error(
      `${origin !== '' ? `[${origin}] - ` : ''}${errorMessage}`,
      error ? (error as Error) : undefined,
    );
    return {
      errorMessage,
    };
  }

  public async getStatsByTemplateTaskId(
    templateTaskId: string,
  ): Promise<GetStatsByTemplateTaskIdResponse | DatabaseErrorResponse> {
    const templateName = await this.timeSaverDb.getTemplateNameByTemplateTaskId(
      templateTaskId,
    );
    if (templateName === undefined) {
      return this.fail(TemplateTaskIdNotFoundError, 'getStatsByTemplateTaskId');
    }
    const queryResult = await this.timeSaverDb.getStatsByTemplateTaskId(
      templateTaskId,
    );
    if (queryResult === undefined) {
      return this.fail(NoStatisticsFoundError, 'getStatsByTemplateTaskId');
    }
    return this.ok<GetStatsByTemplateTaskIdResponse>({
      templateTaskId: templateTaskId,
      templateName: templateName,
      stats: queryResult,
    });
  }

  public async getStatsByTeam(
    team: string,
  ): Promise<GetStatsByTeamResponse | DatabaseErrorResponse> {
    const queryResult = await this.timeSaverDb.getStatsByTeam(team);
    if (queryResult === undefined) {
      return this.fail(NoStatisticsFoundError, 'getStatsByTeam');
    }
    return this.ok<GetStatsByTeamResponse>({
      team: team,
      stats: queryResult,
    });
  }

  public async getStatsByTemplate(
    template: string,
  ): Promise<GetStatsByTemplateResponse | DatabaseErrorResponse> {
    const queryResult = await this.timeSaverDb.getStatsByTemplate(template);
    if (queryResult === undefined) {
      return this.fail(NoStatisticsFoundError, 'getStatsByTemplate');
    }
    return this.ok<GetStatsByTemplateResponse>({
      templateName: template,
      stats: queryResult,
    });
  }

  public async getAllStats(): Promise<
    GetAllStatsResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getAllStats();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getAllStats');
    }
    return this.ok<GetAllStatsResponse>({
      stats: queryResult,
    });
  }

  public async getGroupDivisionStats(): Promise<
    GetGroupDivisionStatsResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getGroupSavingsDivision();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getGroupDivisionStats');
    }
    return this.ok<GetGroupDivisionStatsResponse>({
      stats: queryResult,
    });
  }

  public async getDailyTimeSummariesByTeam(): Promise<
    GetDailyTimeSummariesByTeamResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getDailyTimeSummariesByTeam();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getDailyTimeSummariesByTeam');
    }
    return this.ok<GetDailyTimeSummariesByTeamResponse>({
      stats: queryResult,
    });
  }

  public async getDailyTimeSummariesByTemplate(): Promise<
    GetDailyTimeSummariesByTemplateResponse | DatabaseErrorResponse
  > {
    const queryResult =
      await this.timeSaverDb.getDailyTimeSummariesByTemplate();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getDailyTimeSummariesByTemplate');
    }
    return this.ok<GetDailyTimeSummariesByTemplateResponse>({
      stats: queryResult,
    });
  }

  public async getTimeSavedSummaryByTeam(): Promise<
    GetTimeSavedSummaryByTeamResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getTimeSavedSummaryByTeam();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getTimeSavedSummaryByTeam');
    }
    return this.ok<GetTimeSavedSummaryByTeamResponse>({
      stats: queryResult,
    });
  }

  public async getTimeSavedSummaryByTemplate(): Promise<
    GetTimeSavedSummaryByTemplateResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getTimeSavedSummaryByTemplate();
    if (queryResult === undefined) {
      return this.fail(EmptyDatabaseError, 'getTimeSavedSummaryByTemplate');
    }
    return this.ok<GetTimeSavedSummaryByTemplateResponse>({
      stats: queryResult,
    });
  }

  public async getAllGroups(): Promise<
    GetAllGroupsResponse | TimeSaverApiErrorResponse
  > {
    const queryResult = (await this.timeSaverDb.getDistinctColumn('team')) as
      | { team: string[] }
      | undefined;
    if (!queryResult) {
      return this.fail(EmptyDatabaseError, 'getAllGroups');
    }
    return this.ok<GetAllGroupsResponse>({
      groups: queryResult.team,
    });
  }

  public async getAllTemplateNames(): Promise<
    GetAllTemplateNamesResponse | TimeSaverApiErrorResponse
  > {
    const queryResult = (await this.timeSaverDb.getDistinctColumn(
      'template_name',
    )) as { template_name: string[] } | undefined;
    if (!queryResult) {
      return this.fail(EmptyDatabaseError, 'getAllTemplateNames');
    }
    return this.ok<GetAllTemplateNamesResponse>({
      templates: queryResult.template_name,
    });
  }

  public async getAllTemplateTasks(): Promise<
    GetAllTemplateTasksResponse | TimeSaverApiErrorResponse
  > {
    const queryResult = (await this.timeSaverDb.getDistinctColumn(
      'template_task_id',
    )) as { template_task_id: string[] } | undefined;
    if (!queryResult) {
      return this.fail(EmptyDatabaseError, 'getAllTemplateTasks');
    }
    return this.ok<GetAllTemplateTasksResponse>({
      templateTasks: queryResult.template_task_id,
    });
  }

  public async getTemplateCount(): Promise<
    GetTemplateCountResponse | DatabaseErrorResponse
  > {
    const queryResult = await this.timeSaverDb.getTemplateCount();
    if (queryResult === undefined) {
      return this.fail(DatabaseError, 'getTemplateCount');
    }
    this.logger.debug(`${typeof queryResult === 'number'}`);
    return this.ok<GetTemplateCountResponse>({
      count: queryResult,
    });
  }

  public async getTimeSavedSum(
    divider?: number,
  ): Promise<GetTimeSavedSumResponse | DatabaseErrorResponse> {
    const dividerInt = divider ?? 1;
    const queryResult = await this.timeSaverDb.getTimeSavedSum();
    if (queryResult === undefined) {
      return this.fail(DatabaseError, 'getTimeSavedSum');
    }
    return this.ok<GetTimeSavedSumResponse>({
      timeSaved: queryResult ? queryResult / dividerInt : queryResult,
    });
  }

  public async getSampleMigrationClassificationConfig(
    customClassificationRequest?: object,
    options?: SampleMigrationClassificationConfigOptions,
  ) {
    if (
      typeof customClassificationRequest === 'object' &&
      !Object.keys(customClassificationRequest).length
    ) {
      const errorMessage = `getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object`;
      this.logger.error(
        `getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object`,
      );
      return {
        status: 'FAIL',
        errorMessage,
      };
    }

    const sampleClassification =
      customClassificationRequest || DEFAULT_SAMPLE_CLASSIFICATION;

    let templatesList: string[] = [];
    if (options?.useScaffolderTasksEntries) {
      const templateTaskResponse = await this.getAllTemplateTasks();
      if (isTemplateTaskResponse(templateTaskResponse)) {
        templatesList = templateTaskResponse.templateTasks;
      } else {
        templatesList = DEFAULT_SAMPLE_TEMPLATES_TASKS;
      }
    }
    this.logger.debug(
      `Generating sample classification configuration with ${
        options?.useScaffolderTasksEntries ? 'scaffolder DB' : 'user-defined'
      } templates tasks list and ${
        customClassificationRequest ? 'user-defined' : 'default'
      } classification`,
    );
    return {
      status: 'OK',
      data: templatesList.map(t => ({
        entityRef: t,
        ...sampleClassification,
      })),
    };
  }

  public async updateTemplatesWithSubstituteData(
    requestData?: string,
  ): Promise<{
    status: string;
    message?: string;
    migrationStatisticsReport?: object;
    error?: Error;
  }> {
    let templateClassification: [];
    let migrationStatisticsReport: {
      updatedTemplates: {
        total: number;
        list: string[];
      };
      missingTemplates: {
        total: number;
        list: string[];
      };
    } = {
      updatedTemplates: {
        total: 0,
        list: [],
      },
      missingTemplates: {
        total: 0,
        list: [],
      },
    };
    if (requestData) {
      try {
        if (typeof requestData !== 'object') {
          templateClassification = JSON.parse(requestData);
        } else {
          templateClassification = requestData;
        }

        if (
          !templateClassification ||
          !Object.keys(templateClassification).length
        ) {
          throw new Error(
            `Invalid classification ${JSON.stringify(
              requestData,
            )}. Either it was empty or could not parse JSON string. Aborting...`,
          );
        }
        this.logger.debug(
          `Found classification in API POST body: ${JSON.stringify(
            templateClassification,
          )}`,
        );
      } catch (error) {
        const msg = `Migration: Could not parse JSON object from POST call body "${JSON.stringify(
          requestData,
        )}", aborting...`;
        this.logger.error(msg, error ? (error as Error) : undefined);
        return {
          status: 'FAIL',
          message: `${msg} - ${error}`,
        };
      }
    } else {
      const tsConfigObj =
        this.config.getOptionalString('ts.backward.config') || undefined;
      if (!tsConfigObj) {
        const errorMessage =
          'Migration: Could not find backward migration configuration in app-config.x.yaml, aborting...';
        this.logger.error(errorMessage);
        return {
          status: 'FAIL',
          message: errorMessage,
        };
      }

      try {
        templateClassification = JSON.parse(String(tsConfigObj));
        this.logger.debug(
          `Found classification in app-config.x.yaml: ${JSON.stringify(
            templateClassification,
          )}`,
        );
      } catch (error) {
        const msg =
          'Migration: Could not parse backward migration configuration as JSON object from app-config.x.yaml, aborting...';
        this.logger.error(msg, error ? (error as Error) : undefined);
        return {
          status: 'FAIL',
          message: `${msg} - ${error}`,
        };
      }
    }

    try {
      interface ClassificationMigrationEntry {
        entityRef?: number;
        [key: string]: unknown;
      }

      this.logger.info(`Starting backward migration`);
      const taskTemplateList = await new ScaffolderClient(
        this.auth,
        this.logger,
        this.discovery,
      ).fetchTemplatesFromScaffolder();
      for (let i = 0; i < taskTemplateList.length; i++) {
        const scaffolderTaskRecord = taskTemplateList[i];
        this.logger.debug(
          `Migrating template ${JSON.stringify(scaffolderTaskRecord)}`,
        );
        const { entityRef: templateEntityRef } =
          scaffolderTaskRecord.spec.templateInfo;
        this.logger.debug(
          `Found template with entityRef: ${templateEntityRef}`,
        );
        const classificationEntry = templateClassification.find(
          (con: { entityRef: string | undefined }) =>
            con.entityRef === templateEntityRef,
        );

        if (classificationEntry) {
          //  Delete entityRef
          const newClassificationEntry = Object.assign(
            {},
            classificationEntry as ClassificationMigrationEntry,
          );
          delete newClassificationEntry.entityRef;

          const newTemplateTaskRecordSpecs = {
            ...scaffolderTaskRecord.spec,
            templateInfo: {
              ...scaffolderTaskRecord.spec.templateInfo,
              entity: {
                ...scaffolderTaskRecord.spec.templateInfo.entity,
                metadata: {
                  ...scaffolderTaskRecord.spec.templateInfo.entity.metadata,
                  substitute: newClassificationEntry,
                },
              },
            },
          };

          const patchQueryResult =
            await this.scaffolderDb.updateTemplateTaskById(
              scaffolderTaskRecord.id,
              JSON.stringify(newTemplateTaskRecordSpecs),
            );

          if (patchQueryResult) {
            migrationStatisticsReport = {
              ...migrationStatisticsReport,
              updatedTemplates: {
                total: ++migrationStatisticsReport.updatedTemplates.total,
                list: [
                  ...migrationStatisticsReport.updatedTemplates.list,
                  scaffolderTaskRecord.id,
                ],
              },
            };
            this.logger.debug(
              `scaffolderTaskRecord with id ${scaffolderTaskRecord.id} was patched`,
            );
          }
        } else {
          migrationStatisticsReport = {
            ...migrationStatisticsReport,
            missingTemplates: {
              total: ++migrationStatisticsReport.missingTemplates.total,
              list: [
                ...migrationStatisticsReport.missingTemplates.list,
                scaffolderTaskRecord.id,
              ],
            },
          };
          this.logger.debug(
            `scaffolderTaskRecord with id ${scaffolderTaskRecord.id} was not found in scaffolder DB`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Could not continue with backward migration, aborting...`,
        error ? (error as Error) : undefined,
      );
      return {
        status: 'error',
        error: error ? (error as Error) : undefined,
      };
    }
    return {
      status: 'SUCCESS',
      migrationStatisticsReport,
    };
  }
}
