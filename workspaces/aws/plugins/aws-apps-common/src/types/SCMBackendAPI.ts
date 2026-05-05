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
import { GitProviders } from './git-providers';

/**
 * Result of a Git API operation.
 *
 * @public
 */
export interface IGitAPIResult {
  isSuccess: boolean;
  message: string;
  httpResponse: number;
  value: any;
}

/**
 * Parameters for committing changes to a repository.
 *
 * @public
 */
export interface ICommitChange {
  actions: ICommitAction[];
  branch: string;
  commitMessage: string;
}

/**
 * A single file action within a commit.
 *
 * @public
 */
export interface ICommitAction {
  action: string;
  file_path: string;
  content: string;
}

/**
 * Repository visibility options.
 *
 * @public
 */
export enum GitVisibility {
  PRIVATE = 'private',
  PUBIC = 'public',
}

/**
 * Information describing a Git repository.
 *
 * @public
 */
export interface IRepositoryInfo {
  rawIdentifier?: string;
  gitHost: string;
  gitProjectGroup?: string;
  gitOrganization?: string;
  gitRepoName: string;
  gitJobID?: string;
  projectID?: string;
  description?: string;
  owner?: string;
  isPrivate: boolean;
  visibility?: GitVisibility;
  gitProvider: GitProviders;
}

/**
 * Backend API interface for source control management operations.
 *
 * @public
 */
export interface ISCMBackendAPI {
  gitProvider: GitProviders;
  setGitProvider(provider: GitProviders): void;

  deleteRepository: (
    repo: IRepositoryInfo,
    accessToken: string,
  ) => Promise<IGitAPIResult>;
  createRepository: (
    repo: IRepositoryInfo,
    accessToken: string,
  ) => Promise<IGitAPIResult>;
  getFileContent: (
    filePath: string,
    repo: IRepositoryInfo,
    accessToken: string,
  ) => Promise<IGitAPIResult>;
  commitContent: (
    change: ICommitChange,
    repo: IRepositoryInfo,
    accessToken: string,
  ) => Promise<IGitAPIResult>;
}
