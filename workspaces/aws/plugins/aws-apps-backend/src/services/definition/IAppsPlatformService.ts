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
  DeleteSecretCommandOutput,
  GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';
import { GetParameterCommandOutput } from '@aws-sdk/client-ssm';
import {
  AppPromoParams,
  AWSEnvironmentProviderRecord,
  BindResourceParams,
  IGitAPIResult,
  IRepositoryInfo,
} from '@alithya-oss/backstage-plugin-aws-apps-common';
import { IGitService } from './IGitService';

export interface IAppsPlatformService {
  readonly awsRegion: string;
  readonly platformRegion: string;
  readonly awsAccount: string;
  readonly gitProviderService: IGitService;

  setGitProviderService(provider: IGitService): void;
  setAwsRegion(region: string): void;
  setPlatformRegion(region: string): void;
  setAwsAccount(account: string): void;

  getPlatformSecretValue(
    secretArn: string,
  ): Promise<GetSecretValueCommandOutput>;
  getSsmValue(ssmKey: string): Promise<GetParameterCommandOutput>;
  deletePlatformSecret(secretName: string): Promise<DeleteSecretCommandOutput>;
  deleteTFProvider(
    envName: string,
    providerName: string,
    repo: IRepositoryInfo,
    gitSecretName: string,
  ): Promise<{ status: string; message?: string }>;
  deleteRepository(
    repo: IRepositoryInfo,
    gitSecretName: string,
  ): Promise<IGitAPIResult>;
  getGitToken(gitSecretName: string): Promise<string>;
  getFileContentsFromGit(
    repo: IRepositoryInfo,
    filePath: string,
    gitSecretName: string,
  ): Promise<string>;
  promoteAppToGit(
    input: AppPromoParams,
    repo: IRepositoryInfo,
    gitSecretName: string,
  ): Promise<{ status: string; message?: string }>;
  bindResource(
    repo: IRepositoryInfo,
    input: BindResourceParams,
    gitSecretName: string,
  ): Promise<{ status: string; message?: string }>;
  unBindResource(
    repo: IRepositoryInfo,
    input: BindResourceParams,
    gitSecretName: string,
  ): Promise<{ status: string; message?: string }>;
  updateProvider(
    envName: string,
    provider: AWSEnvironmentProviderRecord,
    repo: IRepositoryInfo,
    entityCatalog: any,
    action: string,
    gitSecretName: string,
  ): Promise<{ status: string; message?: string }>;
}
