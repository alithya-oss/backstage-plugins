import { GitProviders, IRepositoryInfo } from '../types';
import { Entity } from '@backstage/catalog-model';

/** @public */
export const getRepoUrl = (repoInfo: IRepositoryInfo): string => {
  // console.log(repoInfo);
  let gitRepoClean;
  if (repoInfo.gitRepoName.includes('/')) {
    gitRepoClean = repoInfo.gitRepoName.split('/')[1];
  } else {
    gitRepoClean = repoInfo.gitRepoName;
  }

  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    if (repoInfo.gitProjectGroup) {
      return `${repoInfo.gitHost}/${repoInfo.gitProjectGroup}/${gitRepoClean}.git`;
    }
    return `${repoInfo.gitHost}/${repoInfo.gitRepoName}.git`;
  } else if (repoInfo.gitProvider === GitProviders.GITHUB) {
    if (repoInfo.gitOrganization) {
      return `${repoInfo.gitHost}/${repoInfo.gitOrganization}/${gitRepoClean}.git`;
    }
    return `${repoInfo.gitHost}/${repoInfo.gitRepoName}.git`;
  }
  throw Error(`Unsupported git provider ${repoInfo.gitProvider}`);
};

/** @public */
export const getRepoInfo = (entity: Entity): IRepositoryInfo => {
  // let gitProvider: GitProviders = GitProviders.GITLAB;
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

  let projectSlugArray: string[];

  switch (gitProvider) {
    case GitProviders.GITLAB:
      projectSlugArray = entity.metadata.annotations
        ? entity.metadata.annotations['gitlab.com/project-slug']
            ?.toString()
            .split('/')
        : [];
      return {
        gitProvider,
        gitHost: entity.metadata.annotations
          ? entity.metadata.annotations['gitlab.com/instance']?.toString()
          : '',
        gitRepoName: projectSlugArray.pop() || '', // get last element of path for the repository name or empty string if the array is empty
        gitProjectGroup: projectSlugArray.join('/'), // re-join the remainder of the array to get the namespace
        isPrivate: true,
      };
    case GitProviders.GITHUB:
      projectSlugArray = entity.metadata.annotations
        ? entity.metadata.annotations['github.com/project-slug']
            ?.toString()
            .split('/')
        : [];
      return {
        gitHost: 'github.com',
        gitRepoName: projectSlugArray[1], // get last element of the array (repo name)
        gitOrganization: projectSlugArray[0], // get first element of the array (organization)
        gitProvider,
        isPrivate: true,
      };
    default:
      throw Error(`Unsupported git provider: ${entity.metadata.gitProvider}`);
  }
};

/** @public */
export const getGitCredentailsSecret = (repoInfo: IRepositoryInfo): string => {
  if (repoInfo.gitProvider === GitProviders.GITLAB) {
    return 'opa-admin-gitlab-secrets';
  } else if (repoInfo.gitProvider === GitProviders.GITHUB) {
    return 'opa-admin-github-secrets';
  }
  throw Error(`Unsupported git provider ${repoInfo.gitProvider}`);
};
