import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { IAppsPlatformService } from '../definition/IAppsPlatformService';
import { AppsPlatformService } from '../../api/AwsPlatform';

export async function createAppsPlatformService({
  config,
  logger,
}: {
  config: RootConfigService;
  logger: LoggerService;
}): Promise<IAppsPlatformService> {
  logger.info('Apps Platform Service...');
  return new AppsPlatformService(config, logger);
}
