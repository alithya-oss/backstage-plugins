# @alithya-oss/backstage-plugin-argo-workflows-react

Reusable React hooks for the Argo Workflows plugin. Third-party plugins can depend on this package to access workflow data without pulling in the full frontend plugin.

## Installation

```bash
yarn add @alithya-oss/backstage-plugin-argo-workflows-react
```

## Hooks

### `useArgoWorkflows(entity)`

Fetches the workflow list for a Backstage entity based on its annotations.

```typescript
import { useArgoWorkflows } from '@alithya-oss/backstage-plugin-argo-workflows-react';

const { workflows, loading, error, lastUpdated } = useArgoWorkflows(entity);
```

**Parameters:**

- `entity: Entity` — Backstage catalog entity with namespace/label-selector annotations

**Returns:**

- `workflows: WorkflowSummary[]` — List of workflows
- `loading: boolean` — True during initial fetch only
- `error: Error | null` — Error if fetch failed
- `lastUpdated: Date | null` — Timestamp of last successful fetch

Polls at 30-second intervals automatically.

### `useWorkflowDetail(namespace, name)`

Fetches a single workflow's full detail with polling.

```typescript
import { useWorkflowDetail } from '@alithya-oss/backstage-plugin-argo-workflows-react';

const { workflow, loading, error } = useWorkflowDetail(
  'production',
  'my-workflow',
);
```

**Parameters:**

- `namespace: string` — Kubernetes namespace
- `name: string` — Workflow name

**Returns:**

- `workflow: WorkflowDetail | null` — Full workflow with node status
- `loading: boolean` — True during initial fetch only
- `error: Error | null` — Error if fetch failed

Polls at 5-second intervals for running workflows. Stops on terminal states.

### `usePolling<T>(fetchFn, intervalMs, options?)`

Generic polling hook used internally by the other hooks.

```typescript
import { usePolling } from '@alithya-oss/backstage-plugin-argo-workflows-react';

const { data, loading, error, lastUpdated } = usePolling(
  () => fetchSomething(),
  30000,
  { enabled: true, stopWhen: data => data.isComplete },
);
```

**Parameters:**

- `fetchFn: () => Promise<T>` — Async function to call
- `intervalMs: number` — Polling interval in milliseconds
- `options.enabled?: boolean` — Enable/disable polling (default: true)
- `options.stopWhen?: (data: T) => boolean` — Stop condition

**Returns:**

- `data: T | null`, `loading: boolean`, `error: Error | null`, `lastUpdated: Date | null`

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
