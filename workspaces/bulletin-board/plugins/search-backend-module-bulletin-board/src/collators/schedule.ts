import { Config } from '@backstage/config';
import {
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';

export const defaults = {
  schedule: {
    frequency: { minutes: 10 },
    timeout: { minutes: 15 },
    initialDelay: { seconds: 3 },
  },
};

export function readScheduleConfigOptions(
  configRoot: Config,
): SchedulerServiceTaskScheduleDefinition {
  let schedule: SchedulerServiceTaskScheduleDefinition | undefined = undefined;

  const config = configRoot.getOptionalConfig('search.collators.bulletin-board');
  if (config) {
    const scheduleConfig = config.getOptionalConfig('schedule');
    if (scheduleConfig) {
      try {
        schedule =
          readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig);
      } catch (error) {
        throw new InputError(`Invalid schedule at search.collators.bulletin-board, ${error}`);
      }
    }
  }

  return schedule ?? defaults.schedule;
}