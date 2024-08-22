import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  discoveryApiRef,
  identityApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { ragAiApiRef, RoadieRagAiClient } from '@alithya-oss/plugin-rag-ai';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),

  createApiFactory({
    api: ragAiApiRef,
    deps: {
      configApi: configApiRef,
      discoveryApi: discoveryApiRef,
      fetchApi: fetchApiRef,
      identityApi: identityApiRef,
    },
    factory: ({ discoveryApi, fetchApi, configApi, identityApi }) => {
      return new RoadieRagAiClient({
        discoveryApi,
        fetchApi,
        configApi,
        identityApi,
      });
    },
  }),
];
