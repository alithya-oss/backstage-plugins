import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import {
  AnyApiFactory,
  configApiRef,
  createApiFactory,
  useApp,
} from '@backstage/core-plugin-api';
import { catalogApiRef, entityPresentationApiRef } from '@backstage/plugin-catalog-react';
import { DefaultEntityPresentationApi } from '@backstage/plugin-catalog';
export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
  createApiFactory({
    api: entityPresentationApiRef,
    deps: { catalogApi: catalogApiRef },
    factory: ({ catalogApi }) => {
      return DefaultEntityPresentationApi.create({
        catalogApi,
        kindIcons: {
          awsenvironment: useApp().getSystemIcon('kind:domain')!,
          awsenvironmentprovider: useApp().getSystemIcon('kind:system')!,
        },
      });
    },
  }),  
];
