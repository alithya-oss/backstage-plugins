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
import { GitProviders, IRepositoryInfo } from '../types';
import { Entity } from '@backstage/catalog-model';

/**
 * Constructs the full Git clone URL for a repository.
 *
 * @public
 */
export const getRepoUrl = (repoInfo: IRepositoryInfo): string => {
  const gitRepoClean = repoInfo.gitRepoName.includes('/')
    ? repoInfo.gitRepoName.split('/')[1]
    : repoInfo.gitRepoName;

  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    if (repoInfo.gitProjectGroup) {
      return `${repoInfo.gitHost}/${repoInfo.gitProjectGroup}/${gitRepoClean}.git`;
    }
    return `${repoInfo.gitHost}/${repoInfo.gitRepoName}.git`;
  }

  if (repoInfo.gitProvider === GitProviders.GITHUB) {
    if (repoInfo.gitOrganization) {
      return `${repoInfo.gitHost}/${repoInfo.gitOrganization}/${gitRepoClean}.git`;
    }
    return `${repoInfo.gitHost}/${repoInfo.gitRepoName}.git`;
  }

  throw Error(`Unsupported git provider ${repoInfo.gitProvider}`);
};

/**
 * Extracts repository information from a Backstage catalog entity.
 *
 * @public
 */
export const getRepoInfo = (entity: Entity): IRepositoryInfo => {
  const gitProvider = entity.metadata.gitProvider ?? GitProviders.GITLAB;

  // switch (entity.metadata["gitProvider"]){
  //   case "github":
  //     gitProvider = GitProviders.GITHUB
  //     break;
  //   case "gitlab":
  //     gitProvider = GitProviders.GITLAB
  //     break;
  //   default:
  //     throw Error("Unsupported git provider: " + entity.metadata["gitProvider"])
  // }

  switch (gitProvider) {
    case GitProviders.GITLAB:
      return {
        gitProvider,
        gitHost: entity.metadata.annotations
          ? entity.metadata.annotations['gitlab.com/instance']?.toString()
          : '',
        gitRepoName: entity.metadata.annotations
          ? entity.metadata.annotations['gitlab.com/project-slug']?.toString()
          : '',
        gitProjectGroup: entity.metadata.annotations
          ? entity.metadata.annotations['gitlab.com/project-slug']
              ?.toString()
              .split('/')[0]
          : '',
        owner: 'AwsApps-CICD',
        isPrivate: true,
      };
    case GitProviders.GITHUB:
      return {
        gitHost: 'github.com',
        gitRepoName: entity.metadata.annotations
          ? entity.metadata.annotations['github.com/project-slug']
              ?.toString()
              .split('/')[1]
          : '',
        gitOrganization: entity.metadata.annotations
          ? entity.metadata.annotations['github.com/project-slug']
              ?.toString()
              .split('/')[0]
          : '',
        gitProvider,
        isPrivate: true,
      };
    default:
      throw Error(`Unsupported git provider: ${entity.metadata.gitProvider}`);
  }
};

/**
 * Returns the Secrets Manager secret name for Git credentials.
 *
 * @public
 */
export const getGitCredentailsSecret = (repoInfo: IRepositoryInfo): string => {
  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    return 'opa-admin-gitlab-secrets';
  }
  if (repoInfo.gitProvider === GitProviders.GITHUB) {
    return 'opa-admin-github-secrets';
  }
  throw Error(`Unsupported git provider ${repoInfo.gitProvider}`);
};
