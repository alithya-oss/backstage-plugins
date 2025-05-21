import { apiDefinitionFactRetriever } from './apiDefinitionFactRetriever';
import {
  RELATION_OWNED_BY,
  RELATION_API_PROVIDED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { GetEntitiesResponse } from '@backstage/catalog-client';
import { mockServices } from '@backstage/backend-test-utils';
import { DiscoveryService } from '@backstage/backend-plugin-api';

const getEntitiesMock = jest.fn();
jest.mock('@backstage/catalog-client', () => {
  return {
    CatalogClient: jest
      .fn()
      .mockImplementation(() => ({ getEntities: getEntitiesMock })),
  };
});
const discovery: jest.Mocked<DiscoveryService> = {
  getBaseUrl: jest.fn(),
  getExternalBaseUrl: jest.fn(),
};

const defaultEntityListResponse: GetEntitiesResponse = {
  items: [
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-with-definition',
        description: 'api with a definition',
      },
      relations: [
        {
          type: RELATION_API_PROVIDED_BY,
          targetRef: 'component:default/example-website',
        },
        {
          type: RELATION_OWNED_BY,
          targetRef: 'group:default/guests',
        },
        {
          type: RELATION_PART_OF,
          targetRef: 'system:default/examples',
        },
      ],
      spec: {
        type: 'grpc',
        lifecycle: 'experimental',
        owner: 'guests',
        system: 'examples',
        definition:
          'syntax = "proto3";\n\nservice Exampler {\n  rpc Example (ExampleMessage) returns (ExampleMessage) {};\n}\n\nmessage ExampleMessage {\n  string example = 1;\n};\n',
      },
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-with-incomplete-data',
        description: '',
      },
      relations: [],
      spec: {
        type: 'grpc',
        lifecycle: 'experimental',
        owner: 'guests',
        system: 'examples',
        definition: '',
      },
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'API',
      metadata: {
        name: 'api-missing-definition',
      },
      relations: [],
      spec: {
        type: 'openapi',
        lifecycle: 'experimental',
        owner: 'guests',
        system: 'examples',
      },
    },
  ],
};

const handlerContext = {
  discovery,
  logger: mockServices.logger.mock(),
  auth: mockServices.auth(),
  urlReader: mockServices.urlReader.mock(),
  config: ConfigReader.fromConfigs([]),
};

const entityFactRetriever = apiDefinitionFactRetriever;

describe('entityFactRetriever', () => {
  beforeEach(() => {
    getEntitiesMock.mockResolvedValue(defaultEntityListResponse);
  });
  afterEach(() => {
    getEntitiesMock.mockClear();
  });

  describe('hasDefinition', () => {
    describe('where the API entity has a definition in the spec', () => {
      it('returns true for hasDefinition', async () => {
        const facts = await entityFactRetriever.handler(handlerContext);
        expect(
          facts.find(it => it.entity.name === 'api-with-definition'),
        ).toMatchObject({
          facts: {
            hasDefinition: true,
          },
        });
      });
    });
    describe('where the API entity has an empty value for definition in the spec', () => {
      it('returns false for hasDefinition', async () => {
        const facts = await entityFactRetriever.handler(handlerContext);
        expect(
          facts.find(it => it.entity.name === 'api-with-incomplete-data'),
        ).toMatchObject({
          facts: {
            hasDefinition: '',
          },
        });
      });
    });
    describe('where the API entity has a missing definition in the spec', () => {
      it('returns false for hasDefinition', async () => {
        const facts = await entityFactRetriever.handler(handlerContext);
        expect(
          facts.find(it => it.entity.name === 'api-missing-definition'),
        ).toMatchObject({
          facts: {
            hasDefinition: undefined,
          },
        });
      });
    });
  });
});
