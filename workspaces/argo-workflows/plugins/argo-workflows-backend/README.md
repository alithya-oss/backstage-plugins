# @backstage-community/plugin-argo-workflows-backend

Backend plugin that fetches Argo Workflow CRDs from Kubernetes and exposes them as REST endpoints for the frontend plugin.

## Installation

```bash
yarn --cwd packages/backend add @backstage-community/plugin-argo-workflows-backend
```

## Setup

Register the plugin in your backend:

```typescript
// packages/backend/src/index.ts
backend.add(import('@backstage-community/plugin-argo-workflows-backend'));
```

### Kubernetes Configuration

Configure Argo Workflow CRDs as custom resources in `app-config.yaml`:

```yaml
kubernetes:
  customResources:
    - group: argoproj.io
      apiVersion: v1alpha1
      plural: workflows
```

### RBAC Requirements

The Backstage service account needs these permissions:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backstage-argo-workflows
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["workflows"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: backstage-argo-workflows
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: backstage-argo-workflows
subjects:
  - kind: ServiceAccount
    name: backstage
    namespace: backstage
```

## API Routes

All routes require Backstage authentication (except `/health`).

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check — returns `{ status: 'ok' }` |
| `/workflows/:namespace` | GET | List workflows in namespace |
| `/workflows/:namespace/:name` | GET | Get single workflow with full node status |

### Query Parameters (list route)

| Parameter | Type | Description |
|-----------|------|-------------|
| `labelSelector` | string | K8s label selector to filter workflows |

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
