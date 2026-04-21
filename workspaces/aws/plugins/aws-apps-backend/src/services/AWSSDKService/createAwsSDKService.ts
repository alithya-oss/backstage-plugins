import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { AWSSDKService } from '../../api/AwsAppsApi';
import { IAWSSDKService } from '../definition';

export async function createAwsSDKService({
  config,
  logger,
}: {
  config: RootConfigService;
  logger: LoggerService;
}): Promise<IAWSSDKService> {
  logger.info('AWS SDK Service...');
  return new AWSSDKService(config, logger);
}
