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
 * Entity with namespace + label-selector annotations (typical use case).
 */
export const entityWithAnnotations: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'frontend-app',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'argo',
      'backstage.io/kubernetes-label-selector': 'app=frontend',
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
 */
export const entityNamespaceOnly: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backend-api',
    namespace: 'default',
    annotations: {
      'backstage.io/kubernetes-namespace': 'argo',
    },
  },
  spec: {
    type: 'service',
    owner: 'team-backend',
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
      'backstage.io/kubernetes-namespace': 'ml-jobs',
      'backstage.io/kubernetes-label-selector': 'app=ml-platform',
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
