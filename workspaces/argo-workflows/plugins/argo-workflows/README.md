# @backstage-community/plugin-argo-workflows

Frontend plugin for viewing Argo Workflows in Backstage. Provides a workflow list table with expandable DAG visualization, node detail panel, and status indicators.

## Installation

```bash
yarn --cwd packages/app add @backstage-community/plugin-argo-workflows
```

## Setup

Add the plugin to your entity page:

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import { EntityArgoWorkflowsContent } from '@backstage-community/plugin-argo-workflows';

// In your entity page layout:
<EntityLayout.Route path="/argo-workflows" title="Argo Workflows">
  <EntityArgoWorkflowsContent />
</EntityLayout.Route>
```

## Entity Annotations

The plugin reads workflow configuration from entity annotations:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/kubernetes-namespace: production
    backstage.io/kubernetes-label-selector: app=my-service
```

| Annotation | Required | Description |
|-----------|----------|-------------|
| `backstage.io/kubernetes-namespace` | Yes | K8s namespace where workflows run |
| `backstage.io/kubernetes-label-selector` | No | Label selector to filter workflows |

## Troubleshooting

### "No Argo Workflows annotations found on this entity"

The entity is missing the `backstage.io/kubernetes-namespace` annotation. Add it to your `catalog-info.yaml`.

### "No Argo Workflows found in namespace..."

No workflows match the namespace and label selector. Verify:
- Workflows exist in the specified namespace
- The label selector matches your workflow labels
- The backend plugin is running and connected

### "Access denied" (403)

The Backstage service account needs RBAC permissions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backstage-argo-workflows
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["workflows"]
    verbs: ["get", "list"]
```

### "Unable to connect to the Kubernetes cluster"

Check your Backstage Kubernetes plugin configuration in `app-config.yaml`. Ensure the cluster is reachable and the service account token is valid.

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
