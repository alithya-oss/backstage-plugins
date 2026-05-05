/*
 * Copyright 2026 The Alithya Authors
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
  GitProviders,
  IGitAPIResult,
  ICommitChange,
  IRepositoryInfo,
  ISCMBackendAPI,
} from '@alithya-oss/backstage-plugin-aws-apps-common';
import { LoggerService } from '@backstage/backend-plugin-api';

export class GitUnset implements ISCMBackendAPI {
  private _gitProvider: GitProviders;

  public get gitProvider(): GitProviders {
    return this._gitProvider;
  }

  setGitProvider(provider: GitProviders): void {
    this._gitProvider = provider;
  }

  public constructor(private readonly logger: LoggerService) {
    this.logger.info('Instantiating GitHubAPI...');
    this._gitProvider = GitProviders.UNSET;
  }

  public async deleteRepository(
    repo: IRepositoryInfo,
    accessToken: string,
  ): Promise<IGitAPIResult> {
    this.logger.info(Object.values(repo).join(' '));
    this.logger.info(accessToken);
    throw Error('Unset Git Implementation');
  }
  public async createRepository(
    repo: IRepositoryInfo,
    accessToken: string,
  ): Promise<IGitAPIResult> {
    this.logger.info(Object.values(repo).join(' '));
    this.logger.info(accessToken);
    throw Error('Unset Git Implementation');
  }

  public async getFileContent(
    filePath: string,
    repo: IRepositoryInfo,
    accessToken: string,
  ): Promise<IGitAPIResult> {
    this.logger.info(Object.values(repo).join(' '));
    this.logger.info(filePath);
    this.logger.info(accessToken);
    throw Error('Unset Git Implementation');
  }
  public async commitContent(
    change: ICommitChange,
    repo: IRepositoryInfo,
    accessToken: string,
  ): Promise<IGitAPIResult> {
    this.logger.info(Object.values(repo).join(' '));
    this.logger.info(Object.values(change).join(' '));
    this.logger.info(accessToken);
    throw Error('Unset Git Implementation');
  }
}
