# @backstage-community/plugin-argo-workflows

Frontend plugin for viewing Argo Workflow executions in Backstage, featuring a Tekton-style expandable row layout with horizontal DAG card flow visualization.

## Installation

```bash
yarn add @backstage-community/plugin-argo-workflows
```

## Usage

Add the plugin to your entity page:

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import { EntityArgoWorkflowsContent } from '@backstage-community/plugin-argo-workflows';

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/argo-workflows" title="Argo Workflows">
      <EntityArgoWorkflowsContent />
    </EntityLayout.Route>
  </EntityLayout>
);
```
