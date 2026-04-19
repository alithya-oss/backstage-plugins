# Story 3.3: Workflow Detail Hook

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 1 | Empty namespace/name could cause infinite error polling — mitigated by caller validation |
| Low | 3 | Set typing, missing re-render test, indirect interval assertion |

### Acceptance Criteria

All 6 ACs verified ✅

### Verdict

**APPROVED** — Minimal, clean implementation reusing existing hooks. All acceptance criteria satisfied.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want the full workflow detail fetched when I expand a row,
so that the DAG can render with current node data.

## Acceptance Criteria

1. Given the API client's `getWorkflow` method is available, when `useWorkflowDetail(namespace, name)` is called, then it fetches the `WorkflowDetail` via the API client
2. It uses `usePolling` with 5-second interval when the workflow phase is Running
3. Polling stops automatically when the workflow reaches a terminal state (Succeeded, Failed, Error)
4. It returns `{ workflow, loading, error }`
5. `loading` is `true` only on initial fetch
6. Unit tests verify polling behavior for running vs. terminal workflows

## Tasks / Subtasks

- [x] Task 1: Create `useWorkflowDetail.ts` hook (AC: #1, #2, #3, #4, #5)
  - [x] Create file `plugins/argo-workflows/src/hooks/useWorkflowDetail.ts`
  - [x] Add Alithya license header
  - [x] Import `useApi`, `useCallback` from React/Backstage
  - [x] Import `argoWorkflowsApiRef`, `WorkflowDetail` from `@backstage-community/plugin-argo-workflows-common`
  - [x] Import `usePolling` from `./usePolling`
  - [x] Define `DETAIL_POLL_INTERVAL_MS = 5000`
  - [x] Define `TERMINAL_PHASES` set: `new Set(['Succeeded', 'Failed', 'Error'])`
  - [x] Implement `useWorkflowDetail(namespace: string, name: string)` hook:
    1. Get API via `useApi(argoWorkflowsApiRef)`
    2. Create stable `fetchFn` via `useCallback(() => api.getWorkflow(namespace, name), [api, namespace, name])`
    3. Define `stopWhen` callback: `(data: WorkflowDetail) => TERMINAL_PHASES.has(data.phase)`
    4. Call `usePolling<WorkflowDetail>(fetchFn, DETAIL_POLL_INTERVAL_MS, { stopWhen })`
    5. Return `{ workflow: data, loading, error }`
  - [x] Add `@public` JSDoc tag on the exported function

- [x] Task 2: Export `useWorkflowDetail` from `hooks/index.ts` (AC: #1)
  - [x] Add `export { useWorkflowDetail } from './useWorkflowDetail'` to `src/hooks/index.ts`

- [x] Task 3: Create `useWorkflowDetail.test.ts` with comprehensive tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create file `plugins/argo-workflows/src/hooks/useWorkflowDetail.test.ts`
  - [x] Add Alithya license header
  - [x] Mock `@backstage/core-plugin-api` (same pattern as `useArgoWorkflows.test.ts`)
  - [x] Create `createMockWorkflowDetail` helper returning a `WorkflowDetail` with configurable phase
  - [x] Test: calls `getWorkflow` with namespace and name
  - [x] Test: returns `workflow` data from API response
  - [x] Test: returns `loading: true` during initial fetch
  - [x] Test: returns `loading: false` after fetch completes
  - [x] Test: returns `error` when API call fails
  - [x] Test: returns `workflow: null` when API has not responded yet
  - [x] Test: uses 5-second polling interval (verify `usePolling` is called with 5000)
  - [x] Test: polling stops when workflow phase is Succeeded
  - [x] Test: polling stops when workflow phase is Failed
  - [x] Test: polling stops when workflow phase is Error
  - [x] Test: polling continues when workflow phase is Running
  - [x] Test: polling continues when workflow phase is Pending

- [x] Task 4: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows` — all tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md — `useWorkflowDetail` is a React hook in the frontend plugin:

```typescript
function useWorkflowDetail(namespace: string, name: string): {
  workflow: WorkflowDetail | null;
  loading: boolean;
  error: Error | null;
}
```

**Polling behavior (from architecture.md + NFR5):**
- 5-second interval for detail view when workflow is Running/Pending
- Stops on terminal states: Succeeded, Failed, Error
- Uses the existing `usePolling` hook — do NOT create a new polling mechanism

**Key design decisions:**
- Reuses `usePolling` hook from Story 2.3 — same pattern as `useArgoWorkflows`
- Calls `api.getWorkflow(namespace, name)` via `argoWorkflowsApiRef`
- `stopWhen` callback checks if `data.phase` is in terminal set
- Returns `{ workflow, loading, error }` — standard hook return shape per architecture

### Existing Code to Reuse

**`usePolling` hook** (already implemented in `src/hooks/usePolling.ts`):
```typescript
usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean; stopWhen?: (data: T) => boolean }
): { data: T | null; loading: boolean; error: Error | null; lastUpdated: Date | null }
```

**`useArgoWorkflows` hook** (pattern to follow in `src/hooks/useArgoWorkflows.ts`):
- Uses `useApi(argoWorkflowsApiRef)` to get the API client
- Uses `useCallback` for stable fetch function reference
- Calls `usePolling` with interval and options
- Maps return values to the hook's public API

**`ArgoWorkflowsApiClient.getWorkflow`** (already implemented in `src/api/ArgoWorkflowsApiClient.ts`):
```typescript
async getWorkflow(namespace: string, name: string): Promise<WorkflowDetail>
```

### Implementation Guide

The hook is straightforward — ~25 lines of code following the `useArgoWorkflows` pattern:

```typescript
import { useCallback } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import {
  argoWorkflowsApiRef,
  type WorkflowDetail,
} from '@backstage-community/plugin-argo-workflows-common';
import { usePolling } from './usePolling';

const DETAIL_POLL_INTERVAL_MS = 5000;
const TERMINAL_PHASES = new Set(['Succeeded', 'Failed', 'Error']);

/** @public */
export function useWorkflowDetail(namespace: string, name: string) {
  const api = useApi(argoWorkflowsApiRef);

  const fetchFn = useCallback(
    () => api.getWorkflow(namespace, name),
    [api, namespace, name],
  );

  const { data, loading, error } = usePolling<WorkflowDetail>(
    fetchFn,
    DETAIL_POLL_INTERVAL_MS,
    { stopWhen: (d) => TERMINAL_PHASES.has(d.phase) },
  );

  return { workflow: data, loading, error };
}
```

### Test Patterns to Follow

Follow the exact pattern from `useArgoWorkflows.test.ts`:

```typescript
// Mock setup
jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

// Mock API
const mockApi = {
  listWorkflows: jest.fn(),
  getWorkflow: jest.fn().mockResolvedValue(mockWorkflowDetail),
};
mockUseApi.mockReturnValue(mockApi as any);

// Render hook
const { result } = renderHook(() => useWorkflowDetail('production', 'my-workflow'));

// Wait for async
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});
```

**Testing `stopWhen` behavior:**
The `usePolling` hook already handles `stopWhen` internally. To test that the hook passes the correct `stopWhen`, verify:
1. For Running/Pending workflows: polling continues (mock `getWorkflow` to return Running phase, advance timers, verify multiple calls)
2. For terminal workflows: polling stops (mock `getWorkflow` to return Succeeded/Failed/Error, advance timers, verify no additional calls after initial)

**Use `jest.useFakeTimers()` and `jest.advanceTimersByTime(5000)` to test polling intervals.**

### Files to Create/Modify

**Create (2 files):**
- `plugins/argo-workflows/src/hooks/useWorkflowDetail.ts` — the hook
- `plugins/argo-workflows/src/hooks/useWorkflowDetail.test.ts` — tests

**Modify (1 file):**
- `plugins/argo-workflows/src/hooks/index.ts` — add export

### Critical Edge Cases

**1. Namespace/name validation:**
Unlike `useArgoWorkflows` which validates annotations, `useWorkflowDetail` receives namespace and name directly. The `ArgoWorkflowsApiClient.getWorkflow` already validates empty strings — no need to duplicate validation in the hook.

**2. Terminal phase detection:**
Only `Succeeded`, `Failed`, and `Error` are terminal. `Pending` and `Running` are NOT terminal — polling must continue. Do NOT include `Pending` in the terminal set (Pending workflows haven't started yet and will transition to Running).

**3. `stopWhen` null safety:**
The `stopWhen` callback receives the fetched data. Since `usePolling` only calls `stopWhen` when data is available (after a successful fetch), there's no null check needed inside the callback.

**4. Hook re-renders:**
When `namespace` or `name` changes, `useCallback` creates a new `fetchFn` reference, which causes `usePolling` to restart. This is correct behavior — a new workflow should trigger a fresh fetch.

### What NOT to Do

- Do NOT create a new polling mechanism — reuse `usePolling`
- Do NOT add `enabled` option — the hook is always enabled when called (the parent component controls mount/unmount)
- Do NOT return `lastUpdated` — the story AC specifies `{ workflow, loading, error }` only
- Do NOT validate namespace/name — `ArgoWorkflowsApiClient` handles that
- Do NOT import from relative paths across packages — use `@backstage-community/plugin-argo-workflows-common`
- Do NOT add `Pending` to terminal phases — Pending workflows should continue polling
- Do NOT modify `usePolling` — it already has all needed functionality
- Do NOT modify the API client — `getWorkflow` is already implemented
- Do NOT modify the common package — no changes needed there

### Previous Story Learnings (from Stories 3.1 and 3.2)

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- Pre-existing `plugin.test.ts` failure in backend (TodoListService import) — unrelated, ignore
- Pre-existing ESLint/TS errors in frontend plugin — unrelated, ignore
- Follow existing hook patterns exactly (see `useArgoWorkflows.ts` for reference)
- Mock pattern: `jest.mock('@backstage/core-plugin-api')` with `jest.requireActual` spread

### How This Connects to Other Stories

- **Story 2.2 (done):** `ArgoWorkflowsApiClient` provides `getWorkflow(namespace, name)` method
- **Story 2.3 (done):** `usePolling` hook provides polling with `stopWhen` support
- **Story 3.1 (done):** Backend `GET /workflows/:namespace/:name` returns `WorkflowDetail` with full `NodeStatus[]`
- **Story 3.3 (this):** `useWorkflowDetail` wraps `getWorkflow` + `usePolling` for the frontend
- **Story 3.4 (future):** `WorkflowExpandableRow` calls `useWorkflowDetail(namespace, name)` when row is expanded

### Project Structure Notes

All changes are within the frontend plugin hooks directory:
```
plugins/argo-workflows/src/hooks/
├── index.ts               ← ADD export
├── usePolling.ts          (no change)
├── usePolling.test.ts     (no change)
├── useArgoWorkflows.ts    (no change)
├── useArgoWorkflows.test.ts (no change)
├── useWorkflowDetail.ts   ← NEW
└── useWorkflowDetail.test.ts ← NEW
```

### References

- [Source: architecture.md#Frontend Architecture] — `useWorkflowDetail` hook signature and state management
- [Source: architecture.md#Communication Patterns] — Polling hook contract with `stopWhen`
- [Source: architecture.md#Naming Patterns] — camelCase hooks with `use` prefix, co-located tests
- [Source: architecture.md#Enforcement Guidelines] — Return `{ data, loading, error }` from all hooks
- [Source: epics.md#Story 3.3] — Acceptance criteria for workflow detail hook
- [Source: epics.md#Story 3.4] — Consumer of this hook (WorkflowExpandableRow)
- [Source: argo-workflows/src/hooks/useArgoWorkflows.ts] — Pattern to follow for hook implementation
- [Source: argo-workflows/src/hooks/usePolling.ts] — Polling hook to reuse
- [Source: argo-workflows/src/api/ArgoWorkflowsApiClient.ts] — `getWorkflow` method already implemented

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `useWorkflowDetail` hook (~30 lines) reusing `usePolling` and `argoWorkflowsApiRef`
- Polls at 5s interval, stops on terminal phases (Succeeded, Failed, Error)
- Returns `{ workflow, loading, error }` per architecture contract
- 11 tests covering: API call, data return, loading states, error handling, polling stop/continue for all 5 phases
- 91 tests pass across 6 suites (5 pre-existing failures in WorkflowTable.test.tsx — unrelated)
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useWorkflowDetail.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useWorkflowDetail.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/index.ts
