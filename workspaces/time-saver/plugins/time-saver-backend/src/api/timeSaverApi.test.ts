import { TimeSaverApi } from './timeSaverApi';
// import { DEFAULT_SAMPLE_TEMPLATES_TASKS } from './defaultValues';
import {
  LoggerService,
  RootConfigService,
  AuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { ScaffolderStore } from '../database/ScaffolderDatabase';
import { TimeSaverStore } from '../database/TimeSaverDatabase';
import { DateTime } from 'luxon';

describe('TimeSaverApi', () => {
  let auth: AuthService;
  let logger: LoggerService;
  let config: RootConfigService;
  let discovery: DiscoveryService;
  let timeSaverDb: TimeSaverStore;
  let scaffolderDb: ScaffolderStore;
  let tsApi: TimeSaverApi;

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as LoggerService;
    config = { getOptionalString: jest.fn() } as unknown as RootConfigService;
    auth = {} as AuthService;
    discovery = {} as DiscoveryService;
    timeSaverDb = {
      getTemplateNameByTemplateTaskId: jest.fn(),
      getStatsByTemplateTaskId: jest.fn(),
      getStatsByTeam: jest.fn(),
      getStatsByTemplate: jest.fn(),
      getAllStats: jest.fn(),
      getGroupSavingsDivision: jest.fn(),
      getDailyTimeSummariesByTeam: jest.fn(),
      getDailyTimeSummariesByTemplate: jest.fn(),
      getTimeSavedSummaryByTeam: jest.fn(),
      getTimeSavedSummaryByTemplate: jest.fn(),
      getDistinctColumn: jest.fn(),
      getTemplateCount: jest.fn(),
      getTimeSavedSum: jest.fn(),
    } as unknown as TimeSaverStore;
    scaffolderDb = {
      updateTemplateTaskById: jest.fn(),
    } as unknown as ScaffolderStore;
    tsApi = new TimeSaverApi(
      auth,
      logger,
      config,
      discovery,
      timeSaverDb,
      scaffolderDb,
    );
  });

  test('ok method logs and returns result', () => {
    // Arrange
    const result = { data: 'test' };
    const logMessage = 'Test log message';
    jest.spyOn(logger, 'debug');

    // Act
    const returnedResult = tsApi.ok(result, logMessage);

    // Assert
    expect(logger.debug).toHaveBeenCalledWith(
      `${logMessage} ${JSON.stringify(result)}`,
    );
    expect(returnedResult).toEqual(result);
  });

  test('fail method logs error and returns error message', () => {
    // Arrange
    const error = new Error('Test error');
    const errorMessage = 'Test error message';
    const origin = 'TestOrigin';
    jest.spyOn(logger, 'error');

    // Act
    const result = tsApi.fail({ error, errorMessage }, origin);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      `[${origin}] - ${errorMessage}`,
      error,
    );
    expect(result).toEqual({ errorMessage });
  });

  describe('getStatsByTemplateTaskId', () => {
    test('should return data on success', async () => {
      // Arrange
      const templateTaskId = '123';
      const templateName = 'Test Template';
      const stats = [
        {
          team: 'team1',
          timeSaved: 10,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getTemplateNameByTemplateTaskId')
        .mockResolvedValue(templateName);
      jest
        .spyOn(timeSaverDb, 'getStatsByTemplateTaskId')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTemplateTaskId(templateTaskId);

      // Assert
      expect(result).toEqual({
        templateTaskId,
        templateName,
        stats,
      });
    });

    test('should return error on template task ID not found', async () => {
      // Arrange
      const templateTaskId = '123';
      jest
        .spyOn(timeSaverDb, 'getTemplateNameByTemplateTaskId')
        .mockResolvedValue(undefined);
      jest
        .spyOn(timeSaverDb, 'getStatsByTemplateTaskId')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getStatsByTemplateTaskId(templateTaskId);

      // Assert
      expect(result).toEqual({
        errorMessage: 'Template task ID not found',
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      const templateTaskId = '123';
      const templateName = 'Template 1';
      jest
        .spyOn(timeSaverDb, 'getTemplateNameByTemplateTaskId')
        .mockResolvedValue(templateName);
      jest
        .spyOn(timeSaverDb, 'getStatsByTemplateTaskId')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getStatsByTemplateTaskId(templateTaskId);

      // Assert
      expect(result).toEqual({
        errorMessage: 'No statistics found',
      });
    });
  });

  describe('getStatsByTeam', () => {
    test('should return data on success', async () => {
      // Arrange
      const team = 'Team A';
      const stats = [
        {
          templateName: 'template1',
          timeSaved: 10,
        },
        {
          templateName: 'template2',
          timeSaved: 10,
        },
      ];
      jest.spyOn(timeSaverDb, 'getStatsByTeam').mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTeam(team);

      // Assert
      expect(result).toEqual({
        team,
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      const team = 'Team A';
      jest.spyOn(timeSaverDb, 'getStatsByTeam').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getStatsByTeam(team);

      // Assert
      expect(result).toEqual({
        errorMessage: 'No statistics found',
      });
    });
  });

  describe('getStatsByTemplate', () => {
    test('should return data on success', async () => {
      // Arrange
      const templateName = 'template1';
      const stats = [
        {
          team: 'team A',
          timeSaved: 10,
        },
        {
          team: 'team B',
          timeSaved: 10,
        },
      ];
      jest.spyOn(timeSaverDb, 'getStatsByTemplate').mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTemplate(templateName);

      // Assert
      expect(result).toEqual({
        templateName,
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      const templateName = 'template1';
      jest
        .spyOn(timeSaverDb, 'getStatsByTemplate')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getStatsByTeam(templateName);

      // Assert
      expect(result).toEqual({
        errorMessage: 'No statistics found',
      });
    });
  });

  describe('getAllStats', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          team: 'team A',
          templateName: 'template1',
          timeSaved: 10,
        },
        {
          team: 'team B',
          templateName: 'template2',
          timeSaved: 10,
        },
      ];
      jest.spyOn(timeSaverDb, 'getAllStats').mockResolvedValue(stats);

      // Act
      const result = await tsApi.getAllStats();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getAllStats').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllStats();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });

  describe('getGroupDivisionStats', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          team: 'team A',
          percentage: 80,
        },
        {
          team: 'team B',
          percentage: 20,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getGroupSavingsDivision')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getGroupDivisionStats();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest
        .spyOn(timeSaverDb, 'getGroupSavingsDivision')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getGroupDivisionStats();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });

  describe('getDailyTimeSummariesByTeam', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          team: 'team A',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
        {
          team: 'team B',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getDailyTimeSummariesByTeam')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getDailyTimeSummariesByTeam();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest
        .spyOn(timeSaverDb, 'getDailyTimeSummariesByTeam')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getDailyTimeSummariesByTeam();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getDailyTimeSummariesByTemplate', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          templateName: 'template1',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
        {
          templateName: 'template2',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getDailyTimeSummariesByTemplate')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getDailyTimeSummariesByTemplate();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest
        .spyOn(timeSaverDb, 'getDailyTimeSummariesByTemplate')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getDailyTimeSummariesByTemplate();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getTimeSavedSummaryByTeam', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          team: 'team A',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
        {
          team: 'team B',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getTimeSavedSummaryByTeam')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getTimeSavedSummaryByTeam();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest
        .spyOn(timeSaverDb, 'getTimeSavedSummaryByTeam')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTimeSavedSummaryByTeam();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getTimeSavedSummaryByTemplate', () => {
    test('should return data on success', async () => {
      // Arrange
      const stats = [
        {
          templateName: 'template1',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
        {
          templateName: 'template2',
          date: DateTime.fromISO('2024-12-12T12:00:00'),
          totalTimeSaved: 10,
        },
      ];
      jest
        .spyOn(timeSaverDb, 'getTimeSavedSummaryByTemplate')
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getTimeSavedSummaryByTemplate();

      // Assert
      expect(result).toEqual({
        stats,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest
        .spyOn(timeSaverDb, 'getTimeSavedSummaryByTemplate')
        .mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTimeSavedSummaryByTemplate();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getAllGroups', () => {
    test('should return data on success', async () => {
      // Arrange
      const dbResponse = {
        team: ['Team A', 'Team B', 'Team C'],
      };
      jest
        .spyOn(timeSaverDb, 'getDistinctColumn')
        .mockResolvedValue(dbResponse);

      // Act
      const result = await tsApi.getAllGroups();

      // Assert
      expect(result).toEqual({
        groups: dbResponse.team,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getDistinctColumn').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllGroups();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getAllTemplateNames', () => {
    test('should return data on success', async () => {
      // Arrange
      const dbResponse = {
        template_name: ['Template A', 'Template B', 'Template C'],
      };
      jest
        .spyOn(timeSaverDb, 'getDistinctColumn')
        .mockResolvedValue(dbResponse);

      // Act
      const result = await tsApi.getAllTemplateNames();

      // Assert
      expect(result).toEqual({
        templates: dbResponse.template_name,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getDistinctColumn').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllTemplateNames();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getAllTemplateTasks', () => {
    test('should return data on success', async () => {
      // Arrange
      const dbResponse = {
        template_task_id: ['Template A', 'Template B', 'Template C'],
      };
      jest
        .spyOn(timeSaverDb, 'getDistinctColumn')
        .mockResolvedValue(dbResponse);

      // Act
      const result = await tsApi.getAllTemplateTasks();

      // Assert
      expect(result).toEqual({
        templateTasks: dbResponse.template_task_id,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getDistinctColumn').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllTemplateTasks();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Plugin database is empty',
      });
    });
  });
  describe('getTemplateCount', () => {
    test('should return data on success', async () => {
      // Arrange
      const dbResponse = 10;
      jest.spyOn(timeSaverDb, 'getTemplateCount').mockResolvedValue(dbResponse);

      // Act
      const result = await tsApi.getTemplateCount();

      // Assert
      expect(result).toEqual({
        count: dbResponse,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getTemplateCount').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTemplateCount();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Database error',
      });
    });
  });
  describe('getTimeSavedSum', () => {
    test('should return data on success', async () => {
      // Arrange
      const dbResponse = 50;
      jest.spyOn(timeSaverDb, 'getTimeSavedSum').mockResolvedValue(dbResponse);

      // Act
      const result = await tsApi.getTimeSavedSum();

      // Assert
      expect(result).toEqual({
        timeSaved: dbResponse,
      });
    });

    test('should return error on failure', async () => {
      // Arrange
      jest.spyOn(timeSaverDb, 'getTimeSavedSum').mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTimeSavedSum();

      // Assert
      expect(result).toEqual({
        errorMessage: 'Database error',
      });
    });
  });
});
