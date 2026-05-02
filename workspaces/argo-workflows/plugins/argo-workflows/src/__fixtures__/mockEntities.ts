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

import { Entity } from '@backstage/catalog-model';

/**
 * Entity with namespace + label-selector annotations.
 * Matches fixtures in the "default" namespace with label app=my-service.
 */
export const entityWithAnnotations: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'my-service',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'default',
      'backstage.io/kubernetes-label-selector': 'app=my-service',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-platform',
    lifecycle: 'production',
  },
};

/**
 * Entity with namespace annotation only (no label selector).
 * Shows all workflows across the "default" namespace.
 */
export const entityNamespaceOnly: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'all-workflows',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'default',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-backend',
    lifecycle: 'production',
  },
};

/**
 * Entity targeting the "production" namespace.
 * Matches the failed canary deployment fixture.
 */
export const entityProduction: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'production-deploys',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'production',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-sre',
    lifecycle: 'production',
  },
};

/**
 * Entity targeting the "ops" namespace.
 * Matches the nightly backup (error) fixture.
 */
export const entityOps: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'ops-jobs',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'ops',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-ops',
    lifecycle: 'production',
  },
};

/**
 * Entity with cluster annotation for multi-cluster setups.
 */
export const entityWithCluster: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'ml-service',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'default',
      'backstage.io/kubernetes-label-selector': 'type=security',
      'argoworkflows.io/cluster-name': 'gpu-cluster',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-ml',
    lifecycle: 'experimental',
  },
};

/**
 * Entity with no Argo Workflows annotations (empty state).
 */
export const entityWithoutAnnotations: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'docs-site',
    namespace: 'default',
    annotations: {},
  },
  spec: {
    type: 'website',
    owner: 'team-docs',
    lifecycle: 'production',
  },
};
