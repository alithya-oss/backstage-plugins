# Story 3.1: Backend Workflow Detail Route with status.nodes

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want the backend to return a single workflow's full detail including all node statuses,
so that the frontend can render the DAG execution diagram.

## Acceptance Criteria

1. `GET /workflows/:namespace/:name` is called with valid Backstage authentication and returns a `WorkflowDetail` object including the full `nodes` array (`NodeStatus` with id, displayName, type, phase, children, outboundNodes, boundaryID, startedAt, finishedAt, duration, message, templateName)
2. The `workflowMapper` transforms the raw CRD `status.nodes` map into a flat `NodeStatus[]` array
3. Boundary nodes (type DAG, Steps, StepGroup) are included in the response but flagged by their `type` field for frontend filtering
4. Error responses follow the same `ErrorResponse` format as the list route (`{ error: { message, code, statusCode } }`)
5. Unit tests verify the mapper handles complete, partial, and empty `status.nodes` data

## Tasks / Subtasks

- [x] Task 1: Add `mapCrdToWorkflowDetail` to `workflowMapper.ts` (AC: #2, #3)
  - [x] Create `mapCrdToWorkflowDetail(raw: any): WorkflowDetail` function
  - [x] Reuse existing `mapCrdToWorkflowSummary` logic for top-level fields (name, namespace, phase, startedAt, finishedAt, duration, labels)
  - [x] Transform `status.nodes` map into `NodeStatus[]` array with all fields: id, displayName, type, phase, startedAt, finishedAt, duration, message, templateName, children, outboundNodes, boundaryID
  - [x] Include ALL node types in the output (including boundary nodes DAG/Steps/StepGroup) — the `type` field lets the frontend filter them
  - [x] Validate `type` against `NodeType` union — default unknown types to `'Pod'`
  - [x] Validate `phase` against `NodePhase` union — default unknown phases to `'Pending'`
  - [x] Compute `duration` per node using the same `computeDuration` helper
  - [x] Handle `children` and `outboundNodes` as `string[]` — default to `undefined` if missing/empty
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 2: Export `mapCrdToWorkflowDetail` from `mappers/index.ts` (AC: #2)
  - [x] Add `mapCrdToWorkflowDetail` to the barrel export in `mappers/index.ts`

- [x] Task 3: Add `getWorkflow` method to `ArgoWorkflowsService` (AC: #1, #4)
  - [x] Add `getWorkflow(namespace: string, name: string): Promise<WorkflowDetail>` method
  - [x] Fetch single workflow CRD: `GET /apis/argoproj.io/v1alpha1/namespaces/{namespace}/workflows/{name}`
  - [x] Reuse existing `fetchFn`, `clusterUrl`, `clusterToken`, and `AbortSignal.timeout(10_000)` pattern from `listWorkflows`
  - [x] Call `mapCrdToWorkflowDetail` on the response body
  - [x] Handle K8s errors using existing `mapK8sError` method (403, 404, 502)
  - [x] Handle timeout errors with same pattern as `listWorkflows`
  - [x] Handle non-JSON response with 502 error

- [x] Task 4: Add `GET /workflows/:namespace/:name` route to `router.ts` (AC: #1, #4)
  - [x] Add route handler for `router.get('/workflows/:namespace/:name', ...)`
  - [x] Extract `namespace` and `name` from `req.params`
  - [x] Call `service.getWorkflow(namespace, name)`
  - [x] Return `WorkflowDetail` as JSON response
  - [x] Use identical error handling pattern as the list route (catch → `ServiceError` → `ErrorResponse`)

- [x] Task 5: Add unit tests for `mapCrdToWorkflowDetail` in `workflowMapper.test.ts` (AC: #2, #3, #5)
  - [x] Test: maps complete CRD with all node fields (id, displayName, type, phase, startedAt, finishedAt, duration, message, templateName, children, outboundNodes, boundaryID)
  - [x] Test: includes boundary nodes (DAG, Steps, StepGroup) in output with correct type
  - [x] Test: handles missing `status.nodes` — returns empty nodes array
  - [x] Test: handles empty `status.nodes` map — returns empty nodes array
  - [x] Test: handles partial node data (missing optional fields like message, templateName, children)
  - [x] Test: defaults invalid node phase to `'Pending'`
  - [x] Test: defaults invalid node type to `'Pod'`
  - [x] Test: computes per-node duration from startedAt/finishedAt
  - [x] Test: returns undefined duration for nodes without finishedAt
  - [x] Test: handles malformed node entries (null, non-object) gracefully
  - [x] Test: maps top-level workflow fields correctly (reuses summary logic)

- [x] Task 6: Add unit tests for `getWorkflow` in `ArgoWorkflowsService.test.ts` (AC: #1, #4)
  - [x] Test: returns `WorkflowDetail` for successful fetch
  - [x] Test: constructs correct K8s API URL with namespace and name
  - [x] Test: throws 403 ServiceError for K8s 403 response
  - [x] Test: throws 404 ServiceError for K8s 404 response
  - [x] Test: throws 502 ServiceError for K8s 500 response
  - [x] Test: throws 504 ServiceError for timeout
  - [x] Test: throws 502 ServiceError for non-JSON response

- [x] Task 7: Add unit tests for detail route in `router.test.ts` (AC: #1, #4)
  - [x] Add mock for `getWorkflow` method alongside existing `listWorkflows` mock
  - [x] Test: returns 200 with `WorkflowDetail` object
  - [x] Test: passes namespace and name params to service
  - [x] Test: returns `ErrorResponse` for service errors (403, 404, 502)
  - [x] Test: returns 500 for unexpected errors

- [x] Task 8: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows-backend` — all tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows-backend` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md — the detail route is the second backend REST endpoint:

| Route | Method | Response | Purpose |
|-------|--------|----------|---------|
| `/workflows/:namespace/:name` | GET | `WorkflowDetail` | Single workflow with full status.nodes |

The `WorkflowDetail` type extends `WorkflowSummary` and overrides `nodes` with full `NodeStatus[]`:

```typescript
// From argo-workflows-common/src/types.ts (already exists)
interface WorkflowDetail extends WorkflowSummary {
  nodes: NodeStatus[];
}

interface NodeStatus {
  id: string;
  displayName: string;
  type: NodeType;
  phase: NodePhase;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  message?: string;
  templateName?: string;
  children?: string[];
  outboundNodes?: string[];
  boundaryID?: string;
}
```

### Files to Create/Modify

**Modify (4 files):**
- `plugins/argo-workflows-backend/src/mappers/workflowMapper.ts` — add `mapCrdToWorkflowDetail`
- `plugins/argo-workflows-backend/src/mappers/index.ts` — export new function
- `plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.ts` — add `getWorkflow` method
- `plugins/argo-workflows-backend/src/router.ts` — add detail route

**Modify (3 test files):**
- `plugins/argo-workflows-backend/src/mappers/workflowMapper.test.ts` — add detail mapper tests
- `plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.test.ts` — add getWorkflow tests
- `plugins/argo-workflows-backend/src/router.test.ts` — add detail route tests

### Critical Implementation Details

**1. Boundary Node Handling (AC #3):**
Unlike the summary mapper (`mapCrdToWorkflowSummary`) which FILTERS OUT boundary nodes (DAG, Steps, StepGroup), the detail mapper (`mapCrdToWorkflowDetail`) MUST INCLUDE them. The frontend needs boundary nodes to understand the DAG structure — it will filter them during rendering via `computeDAGColumns`. The `type` field on each `NodeStatus` is how the frontend distinguishes boundary from execution nodes.

**2. Reuse Existing Patterns:**
The existing `mapCrdToWorkflowSummary` already handles top-level fields. The new `mapCrdToWorkflowDetail` should reuse the same logic for name, namespace, phase, startedAt, finishedAt, duration, labels. Extract shared logic into a helper or call `mapCrdToWorkflowSummary` and override `nodes`.

**3. K8s API URL for Single Workflow:**
```
GET /apis/argoproj.io/v1alpha1/namespaces/{namespace}/workflows/{name}
```
This returns a single Workflow CRD object (not a list). The response has `metadata`, `spec`, and `status` at the top level — same structure as items in the list response.

**4. Node ID Mapping:**
The raw CRD `status.nodes` is a `Record<string, any>` where keys are node IDs. The mapper must use the key as the `id` field in `NodeStatus`. Example:
```json
{
  "status": {
    "nodes": {
      "my-workflow-abc": { "displayName": "my-workflow-abc", "type": "DAG", ... },
      "my-workflow-abc-build-123": { "displayName": "build", "type": "Pod", ... }
    }
  }
}
```

**5. Valid NodeType Values:**
```typescript
type NodeType = 'Pod' | 'DAG' | 'Steps' | 'StepGroup' | 'Retry' | 'Suspend' | 'HTTP' | 'Skipped' | 'TaskGroup';
```
Default unknown types to `'Pod'` (safest default — renders as an execution node).

**6. Error Response Format (same as list route):**
```typescript
res.status(statusCode).json({
  error: { message, code, statusCode },
});
```

### Existing Code Patterns to Follow

**Router pattern** (from `router.ts`):
```typescript
router.get('/workflows/:namespace/:name', async (req, res) => {
  const { namespace, name } = req.params;
  try {
    const workflow = await service.getWorkflow(namespace, name);
    res.json(workflow);
  } catch (err: any) {
    const statusCode = (err as ServiceError).statusCode ?? 500;
    const code = (err as ServiceError).code ?? 'INTERNAL_ERROR';
    const message = err.message ?? 'An unexpected error occurred';
    res.status(statusCode).json({
      error: { message, code, statusCode },
    });
  }
});
```

**Service fetch pattern** (from `ArgoWorkflowsService.listWorkflows`):
- Use `this.fetchFn` with `AbortSignal.timeout(10_000)`
- Set `Authorization: Bearer ${this.clusterToken}` header if token exists
- Set `Accept: application/json` header
- Call `this.mapK8sError(response.status, namespace)` for non-OK responses
- Parse JSON body, throw 502 on parse failure

**Test mock pattern** (from `router.test.ts`):
```typescript
jest.mock('./service', () => {
  const mockListWorkflows = jest.fn();
  const mockGetWorkflow = jest.fn();
  return {
    ArgoWorkflowsService: jest.fn().mockImplementation(() => ({
      listWorkflows: mockListWorkflows,
      getWorkflow: mockGetWorkflow,
    })),
    __mockListWorkflows: mockListWorkflows,
    __mockGetWorkflow: mockGetWorkflow,
  };
});
```

**Service test pattern** (from `ArgoWorkflowsService.test.ts`):
- Use `createMockFetch(body, status)` helper to create mock fetch functions
- Use `createService(fetchFn)` helper to instantiate service with mock
- Assert on the URL passed to `fetchFn`

### Frontend API Client Already Exists

The frontend `ArgoWorkflowsApiClient.getWorkflow(namespace, name)` method already exists and calls `GET /workflows/:namespace/:name`. This story provides the backend endpoint it expects. No frontend changes needed.

### What NOT to Do

- Do NOT add any new npm dependencies — all needed packages are already installed
- Do NOT modify the common package types — `WorkflowDetail` and `NodeStatus` already exist in `types.ts`
- Do NOT modify the frontend plugin — this is a backend-only story
- Do NOT filter out boundary nodes in the detail mapper — include ALL nodes with their `type` field (unlike the summary mapper which filters them)
- Do NOT add authentication middleware — the router already handles auth via the plugin system's `httpAuth`
- Do NOT create a `__tests__/` directory — tests are co-located with source files
- Do NOT use Material UI or any MUI imports
- Do NOT use `instanceof` checks for error handling in the router — use duck typing with `(err as ServiceError).statusCode`
- Do NOT add caching — no server-side caching for MVP per architecture decision
- Do NOT create a separate service class — add `getWorkflow` as a method on the existing `ArgoWorkflowsService`

### Previous Story Learnings (from Epic 2)

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `createServiceError(message, code, statusCode)` helper already exists in `ArgoWorkflowsService.ts` — reuse it
- `mapK8sError(status, namespace)` private method already handles 403/404/default error mapping — reuse it
- Router test uses `jest.mock('./service')` with `__mockListWorkflows` pattern — extend it with `__mockGetWorkflow`
- Service test uses `createMockFetch` and `createService` helpers — reuse them for `getWorkflow` tests
- `computeDuration(startedAt, finishedAt)` helper already exists in `workflowMapper.ts` — reuse it for per-node duration
- `VALID_NODE_PHASES` and `BOUNDARY_NODE_TYPES` sets already exist in `workflowMapper.ts` — reuse them
- Pre-existing ESLint conflict on frontend plugin — known issue, does not affect backend

### Project Structure Notes

All changes are within the existing backend plugin structure:
```
plugins/argo-workflows-backend/src/
├── router.ts              ← ADD detail route
├── router.test.ts         ← ADD detail route tests
├── service/
│   ├── ArgoWorkflowsService.ts      ← ADD getWorkflow method
│   ├── ArgoWorkflowsService.test.ts ← ADD getWorkflow tests
│   └── index.ts                     (no change)
├── mappers/
│   ├── workflowMapper.ts      ← ADD mapCrdToWorkflowDetail
│   ├── workflowMapper.test.ts ← ADD detail mapper tests
│   └── index.ts               ← ADD export
└── index.ts                   (no change)
```

### References

- [Source: architecture.md#API & Communication Patterns] — REST route definition: `GET /workflows/:namespace/:name` → `WorkflowDetail`
- [Source: architecture.md#Data Architecture] — Backend transforms CRD to typed API response, `WorkflowDetail` extends `WorkflowSummary` with full `NodeStatus[]`
- [Source: architecture.md#Implementation Patterns] — Error response format `{ error: { message, code, statusCode } }`, co-located tests, `@public` JSDoc tags
- [Source: architecture.md#Structure Patterns] — Backend structure with `service/`, `mappers/`, `router.ts`
- [Source: epics.md#Story 3.1] — Acceptance criteria for backend workflow detail route
- [Source: argo-workflows-common/src/types.ts] — `WorkflowDetail`, `NodeStatus`, `NodeType`, `NodePhase` type definitions
- [Source: plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.ts] — Existing `listWorkflows` method, `createServiceError`, `mapK8sError`
- [Source: plugins/argo-workflows-backend/src/mappers/workflowMapper.ts] — Existing `mapCrdToWorkflowSummary`, `computeDuration`, `VALID_NODE_PHASES`, `BOUNDARY_NODE_TYPES`
- [Source: plugins/argo-workflows-backend/src/router.ts] — Existing list route pattern and error handling
- [Source: plugins/argo-workflows/src/api/ArgoWorkflowsApiClient.ts] — Frontend `getWorkflow` method already calls this endpoint

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `mapCrdToWorkflowDetail` mapper that transforms raw CRD into `WorkflowDetail` with full `NodeStatus[]` — includes ALL nodes (boundary + execution) unlike the summary mapper
- Added `extractFullNodes` helper using `Object.entries` to preserve node map keys as IDs
- Added `VALID_NODE_TYPES` set for type validation, defaults unknown types to `'Pod'`
- Added `getWorkflow(namespace, name)` method to `ArgoWorkflowsService` following identical fetch/error pattern as `listWorkflows`
- Added `GET /workflows/:namespace/:name` route to router with same error handling pattern
- 13 new mapper tests, 7 new service tests, 4 new router tests — 65 total tests pass across 3 suites
- Build succeeds; pre-existing `plugin.test.ts` failure (TodoListService import) unrelated to changes
- Removed unused `ServiceError` type import from service test file

### File List

workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/workflowMapper.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/workflowMapper.test.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/index.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.test.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.test.ts
