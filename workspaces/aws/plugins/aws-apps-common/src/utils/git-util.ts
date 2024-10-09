import { GitProviders, IRepositoryInfo } from '../types';
import { Entity } from '@backstage/catalog-model';

/** @public */
export const getRepoUrl = (repoInfo: IRepositoryInfo): string => {
  console.log(repoInfo);
  let gitRepoClean;
  if (repoInfo.gitRepoName.includes('/')) {
    gitRepoClean = repoInfo.gitRepoName.split('/')[1];
  } else {
    gitRepoClean = repoInfo.gitRepoName;
  }

  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    if (repoInfo.gitProjectGroup) {
      return (
        repoInfo.gitHost +
        '/' +
        repoInfo.gitProjectGroup +
        '/' +
        gitRepoClean +
        '.git'
      );
    } else {
      return repoInfo.gitHost + '/' + repoInfo.gitRepoName + '.git';
    }
  } else if (repoInfo.gitProvider === GitProviders.GITHUB) {
    if (repoInfo.gitOrganization) {
      return (
        repoInfo.gitHost +
        '/' +
        repoInfo.gitOrganization +
        '/' +
        gitRepoClean +
        '.git'
      );
    } else {
      return repoInfo.gitHost + '/' + repoInfo.gitRepoName + '.git';
    }
  } else {
    throw Error('Unsupported git provider ' + repoInfo.gitProvider);
  }
};

/** @public */
export const getRepoInfo = (entity: Entity): IRepositoryInfo => {
  // let gitProvider: GitProviders = GitProviders.GITLAB;
  let gitProvider = entity.metadata['gitProvider'] ?? GitProviders.GITLAB;
  let repoUrl = entity.metadata['repoUrl']?? GitProviders.GITLAB;
  const repoInfo = extractRepoInfo(repoUrl.toString());

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
        gitHost: repoInfo.host,
        gitRepoName: repoInfo.repo,
        gitProjectGroup: repoInfo.owner,
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
      throw Error(
        'Unsupported git provider: ' + entity.metadata['gitProvider'],
      );
  }
};

/** @public */
export const getGitCredentailsSecret = (repoInfo: IRepositoryInfo): string => {
  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    return 'opa-admin-gitlab-secrets';
  } else if (repoInfo.gitProvider === GitProviders.GITHUB) {
    return 'opa-admin-github-secrets';
  } else {
    throw Error('Unsupported git provider ' + repoInfo.gitProvider);
  }
};
function extractRepoInfo(repoUrl: string) {
  // Extract the base host (e.g., gitlab.com) and query parameters
  const [host, queryParams] = repoUrl.split('?');
  
  // Parse the query parameters
  const urlSearchParams = new URLSearchParams(queryParams);
  const owner = urlSearchParams.get('owner'); // Extract owner parameter
  const repo = urlSearchParams.get('repo');   // Extract repo parameter
  
  // Return the extracted values
  return {
    host: host,
    owner: owner ? decodeURIComponent(owner) : '',
    repo: repo ? repo : '',
  };
}