import { CatalogClient } from '@backstage/catalog-client';
import { Entity, ApiEntityV1alpha1 } from '@backstage/catalog-model';
import {
  FactRetriever,
  FactRetrieverContext,
} from '@backstage-community/plugin-tech-insights-node';

/**
 * Generates facts which indicate the quality of data in the spec.definition field of API entities.
 *
 * @public
 */
export const apiDefinitionFactRetriever: FactRetriever = {
  id: 'apiDefinitionFactRetriever',
  version: '0.0.1',
  title: 'API Definition',
  description: 'Generates facts which indicate the completeness of API spec',
  schema: {
    hasDefinition: {
      type: 'boolean',
      description: 'The entity has a definition in spec',
    },
  },
  handler: async ({ discovery, auth }: FactRetrieverContext) => {
    const { token } = await auth.getPluginRequestToken({
      onBehalfOf: await auth.getOwnServiceCredentials(),
      targetPluginId: 'catalog',
    });
    const catalogClient = new CatalogClient({
      discoveryApi: discovery,
    });
    const entities = await catalogClient.getEntities(
      { filter: { kind: ['API'] } },
      { token },
    );

    return entities.items.map((entity: Entity) => {
      return {
        entity: {
          namespace: entity.metadata.namespace!,
          kind: entity.kind,
          name: entity.metadata.name,
        },
        facts: {
          hasDefinition:
            (entity as ApiEntityV1alpha1).spec?.definition &&
            (entity as ApiEntityV1alpha1).spec?.definition.length > 0,
        },
      };
    });
  },
};
