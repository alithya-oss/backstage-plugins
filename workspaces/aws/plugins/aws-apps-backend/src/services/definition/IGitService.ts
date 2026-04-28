import {
  GitProviders,
  ISCMBackendAPI,
} from '@alithya-oss/backstage-plugin-aws-apps-common';

/** @public */
export interface IGitService {
  gitProvider: GitProviders;
  setGitProvider(provider: GitProviders): void;
  gitProviderImpl: ISCMBackendAPI;
  setGitProviderImpl(provider: ISCMBackendAPI): void;
}
