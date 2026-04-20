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

/**
 * Entity annotation for the Kubernetes namespace where Argo Workflows are deployed.
 * @public
 */
export const ARGO_WORKFLOWS_NAMESPACE_ANNOTATION =
  'backstage.io/kubernetes-namespace';

/**
 * Entity annotation for filtering workflows by Kubernetes label selector.
 * @public
 */
export const ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION =
  'backstage.io/kubernetes-label-selector';

/**
 * Entity annotation for specifying the target Kubernetes cluster name.
 * @public
 */
export const ARGO_WORKFLOWS_CLUSTER_ANNOTATION =
  'argoworkflows.io/cluster-name';
