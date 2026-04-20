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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

/**
 * Translation ref for the Argo Workflows plugin.
 *
 * @public
 */
export const argoWorkflowsTranslationRef = createTranslationRef({
  id: 'plugin.argo-workflows',
  messages: {
    workflowTable: {
      searchPlaceholder: 'Search by name…',
      pollUpdated: 'Updated {{time}}',
      noMatchFilters: 'No workflows match the current filters.',
      clearFilters: 'Clear filters',
    },
    emptyState: {
      noWorkflows:
        'No Argo Workflows found in namespace {{namespace}}.',
      noWorkflowsWithSelector:
        'No Argo Workflows found in namespace {{namespace}} matching label selector {{selector}}.',
      noWorkflowsGeneric: 'No Argo Workflows found for this entity.',
      missingAnnotation:
        'No Argo Workflows annotations found on this entity. Add backstage.io/kubernetes-namespace to your catalog-info.yaml.',
      accessDenied:
        'The Backstage service account needs get and list permissions on workflows.argoproj.io.',
      permissionDenied:
        "You don't have permission to view Argo Workflows for this entity. Contact your Backstage administrator.",
      clusterError:
        'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
      unknownError: 'An unknown error occurred.',
      noWorkflowsTitle: 'No Workflows',
      missingConfigTitle: 'Missing Configuration',
      accessDeniedTitle: 'Access Denied',
      clusterErrorTitle: 'Cluster Unreachable',
      errorTitle: 'Error',
    },
    dagFlow: {
      noNodes: 'This workflow has no execution nodes.',
      errorFallback:
        'Unable to render workflow graph. Showing metadata only.',
    },
    nodePanel: {
      phase: 'Phase',
      type: 'Type',
      template: 'Template',
      started: 'Started',
      finished: 'Finished',
      duration: 'Duration',
      closeLabel: 'Close node detail panel',
      errorFallback: 'Unable to display node details',
    },
    pageFallback: {
      message: 'Something went wrong loading Argo Workflows.',
      refresh: 'Try refreshing the page',
    },
    dagFullPage: {
      back: '← Back',
      loading: 'Loading workflow…',
      notFound: 'Workflow not found',
    },
  },
});
