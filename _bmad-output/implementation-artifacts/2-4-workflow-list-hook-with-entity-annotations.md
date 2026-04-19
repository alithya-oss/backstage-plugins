# Story 2.4: Workflow List Hook with Entity Annotations

Status: done

## Story

As a service owner,
I want workflow data fetched automatically based on my entity's annotations,
so that I see workflows relevant to my service without any manual configuration.

## Acceptance Criteria

1. `useArgoWorkflows` hook reads the namespace and label selector from entity annotations
2. It calls `listWorkflows` via the API client with the resolved parameters
3. It uses `usePolling` with a 30-second interval
4. It returns `{ workflows, loading, error }`
5. If the namespace annotation is missing, it returns an error indicating missing configuration
6. Unit tests verify annotation resolution, API call construction, and error states

## Tasks / Subtasks

- [x] Task 1: Create `hooks/useArgoWorkflows.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Import `useApi` from `@backstage/core-plugin-api`
  - [x] Import `argoWorkflowsApiRef`, `ARGO_WORKFLOWS_NAMESPACE_ANNOTATION`, `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION` from common
  - [x] Import `usePolling` from `./usePolling`
  - [x] Import `Entity` from `@backstage/catalog-model`
  - [x] Accept `entity: Entity` parameter
  - [x] Read `backstage.io/kubernetes-namespace` annotation from entity — if missing, return `{ workflows: [], loading: false, error: Error('Missing...') }`
  - [x] Read `backstage.io/kubernetes-label-selector` annotation from entity (optional)
  - [x] Use `useApi(argoWorkflowsApiRef)` to get the API client
  - [x] Create `fetchFn` that calls `api.listWorkflows(namespace, labelSelector)`
  - [x] Pass `fetchFn` to `usePolling` with `intervalMs: 30000`
  - [x] Map `usePolling` return to `{ workflows: data ?? [], loading, error }`
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 2: Create `hooks/useArgoWorkflows.test.ts` (AC: #6)
  - [x] Mock `useApi` to return a mock API client
  - [x] Create helper to build mock `Entity` with annotations
  - [x] Test: entity with namespace annotation calls `listWorkflows` with correct namespace
  - [x] Test: entity with namespace + labelSelector annotations passes both to `listWorkflows`
  - [x] Test: entity without namespace annotation returns error immediately
  - [x] Test: returns `workflows` array from API response
  - [x] Test: returns `loading: true` during initial fetch
  - [x] Test: returns `error` when API call fails

- [x] Task 3: Update `hooks/index.ts` — add export
  - [x] Export `useArgoWorkflows` from `./useArgoWorkflows`

- [x] Task 4: Update `src/index.ts` — export hook
  - [x] Export `useArgoWorkflows` from `./hooks`

- [x] Task 5: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass
  - [x] Run `yarn backstage-cli package build` — must succeed

## Dev Notes

### Architecture Contract

From architecture.md — the hook signature:

```typescript
function useArgoWorkflows(entity: Entity): {
  workflows: WorkflowSummary[];
  loading: boolean;
  error: Error | null;
}
```

Key: returns `workflows` (not `data`), always an array (never null), uses 30s polling interval.

### Annotation Resolution

```typescript
import { Entity } from '@backstage/catalog-model';
import {
  ARGO_WORKFLOWS_NAMESPACE_ANNOTATION,
  ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION,
} from '@backstage-community/plugin-argo-workflows-common';

const namespace = entity.metadata.annotations?.[ARGO_WORKFLOWS_NAMESPACE_ANNOTATION];
const labelSelector = entity.metadata.annotations?.[ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION];
```

If `namespace` is undefined/empty, return an error immediately — do NOT call the API.

### usePolling Integration

```typescript
const { data, loading, error } = usePolling<WorkflowSummary[]>(
  fetchFn,
  30000,
  { enabled: !!namespace },
);

return {
  workflows: data ?? [],
  loading,
  error: namespace ? error : new Error('Missing backstage.io/kubernetes-namespace annotation'),
};
```

Use `enabled: false` when namespace is missing to prevent `usePolling` from fetching.

### Testing Pattern

Mock `useApi` from `@backstage/core-plugin-api`:

```typescript
import { useApi } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));
```

Create mock entity helper:

```typescript
function createMockEntity(annotations: Record<string, string> = {}): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-service',
      annotations,
    },
  };
}
```

### File Locations

- `plugins/argo-workflows/src/hooks/useArgoWorkflows.ts` — NEW
- `plugins/argo-workflows/src/hooks/useArgoWorkflows.test.ts` — NEW
- `plugins/argo-workflows/src/hooks/index.ts` — UPDATE (add export)
- `plugins/argo-workflows/src/index.ts` — UPDATE (add export)

### Dependencies

All needed dependencies are already in `package.json`:
- `@backstage/core-plugin-api` — `useApi`
- `@backstage/catalog-model` — `Entity`
- `@backstage-community/plugin-argo-workflows-common` — annotations, API ref, types
- `@testing-library/react` (dev dep) — `renderHook`, `waitFor`

Do NOT add any new dependencies.

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — known issue
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `@public` JSDoc tags required on all exported symbols
- `usePolling` validates `intervalMs` > 0 — always pass a valid number
- `usePolling` with `enabled: false` skips both initial fetch and polling

### What NOT to Do

- Do NOT add React components — this is a hook only
- Do NOT modify the common package or backend
- Do NOT add new npm dependencies
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT duplicate polling logic — delegate to `usePolling`
- Do NOT hardcode annotation strings — use constants from common package

### References

- [Source: architecture.md#State Management] — useArgoWorkflows hook signature
- [Source: architecture.md#Naming Conventions] — hooks use camelCase with `use` prefix
- [Source: common/annotations.ts] — annotation constants
- [Source: common/api.ts] — ArgoWorkflowsApi interface, argoWorkflowsApiRef
- [Source: epics.md#Story 2.4] — acceptance criteria

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Implemented `useArgoWorkflows(entity)` hook matching architecture contract
- Reads `backstage.io/kubernetes-namespace` and `backstage.io/kubernetes-label-selector` from entity annotations
- Uses `useApi(argoWorkflowsApiRef)` to get API client, delegates to `usePolling` at 30s interval
- Missing namespace annotation returns immediate error with `enabled: false` (no API call)
- Returns `{ workflows: WorkflowSummary[], loading, error }` — workflows defaults to `[]` when null
- 7 new tests pass, 41 total tests pass across frontend plugin
- Build succeeds, no new dependencies

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useArgoWorkflows.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useArgoWorkflows.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/index.ts
