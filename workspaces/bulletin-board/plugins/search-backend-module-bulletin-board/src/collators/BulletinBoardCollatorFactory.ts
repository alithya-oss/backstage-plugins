import { Config } from '@backstage/config';
import { Readable } from 'stream';
import { DocumentCollatorFactory } from '@backstage/plugin-search-common';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';

export type BulletinBoardCollatorFactoryOptions = {
  logger: LoggerService;
  discovery: DiscoveryService;
  auth?: AuthService;
};

export class BulletinBoardCollatorFactory implements DocumentCollatorFactory {
  public readonly type: string = 'bulletin-board';
  private readonly logger: LoggerService;
  private readonly auth?: AuthService;
}
