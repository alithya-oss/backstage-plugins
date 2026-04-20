# @alithya-oss/backstage-plugin-argo-workflows-backend

Backend plugin that fetches Argo Workflow CRDs from Kubernetes and exposes them as REST endpoints with permission-controlled access.

## Installation

```bash
yarn --cwd packages/backend add @alithya-oss/backstage-plugin-argo-workflows-backend
```

## Setup

```typescript
// packages/backend/src/index.ts
backend.add(import('@alithya-oss/backstage-plugin-argo-workflows-backend'));
```

### Kubernetes Configuration

```yaml
# app-config.yaml
kubernetes:
  customResources:
    - group: argoproj.io
      apiVersion: v1alpha1
      plural: workflows
```

### RBAC Requirements

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backstage-argo-workflows
rules:
  - apiGroups: ['argoproj.io']
    resources: ['workflows']
    verbs: ['get', 'list']
```

## Permission Framework

The plugin integrates with the Backstage permission framework. All data routes check `argo-workflows.workflow.read` permission.

To restrict access, define a permission policy:

```typescript
import { argoWorkflowsReadPermission } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import {
  isPermission,
  AuthorizeResult,
} from '@backstage/plugin-permission-common';

class MyPermissionPolicy implements PermissionPolicy {
  async handle(request, user) {
    if (isPermission(request.permission, argoWorkflowsReadPermission)) {
      // Your authorization logic here
      return { result: AuthorizeResult.ALLOW };
    }
    return { result: AuthorizeResult.ALLOW };
  }
}
```

By default (no policy configured), all authenticated users have access.

## API Routes

All routes require Backstage authentication (except `/health`). All data routes require `argo-workflows.workflow.read` permission.

| Route                         | Method | Description                               |
| ----------------------------- | ------ | ----------------------------------------- |
| `/health`                     | GET    | Health check — returns `{ status: 'ok' }` |
| `/workflows/:namespace`       | GET    | List workflows in namespace               |
| `/workflows/:namespace/:name` | GET    | Get single workflow with full node status |

### Query Parameters (list route)

| Parameter       | Type   | Description                            |
| --------------- | ------ | -------------------------------------- |
| `labelSelector` | string | K8s label selector to filter workflows |

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
