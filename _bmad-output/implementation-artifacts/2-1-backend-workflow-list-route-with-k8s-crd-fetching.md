# Story 2.1: Backend Workflow List Route with K8s CRD Fetching

Status: done

## Story

As a service owner,
I want the backend to fetch Argo Workflow CRDs from Kubernetes and expose them as a REST endpoint,
so that the frontend can display workflow data without direct K8s access.

## Acceptance Criteria

1. `GET /workflows/:namespace` returns an array of `WorkflowSummary` objects with camelCase JSON fields
2. Each summary includes name, namespace, phase, startedAt, finishedAt, duration, and nodes (phase + displayName only)
3. The `labelSelector` query parameter filters workflows by Kubernetes labels
4. `limit` and `offset` query parameters support pagination
5. A 403 K8s error returns HTTP 403 with `ErrorResponse` format and actionable message
6. A 404 K8s error returns HTTP 404 with namespace-specific guidance
7. A K8s timeout returns HTTP 504 with retry guidance
8. The route requires Backstage `httpAuth` authentication
9. Unit tests cover success, error mapping, and pagination scenarios

## Tasks / Subtasks

- [x] Task 1: Create `mappers/workflowMapper.ts` — CRD-to-WorkflowSummary transformer (AC: #1, #2)
  - [x] Create `mappers/` directory with `index.ts` barrel export
  - [x] Implement `mapCrdToWorkflowSummary(raw: any): WorkflowSummary` function
  - [x] Map metadata fields: `metadata.name` → `name`, `metadata.namespace` → `namespace`, `metadata.labels` → `labels`
  - [x] Map status fields: `status.phase` → `phase`, `status.startedAt` → `startedAt`, `status.finishedAt` → `finishedAt`
  - [x] Compute `duration` in seconds from `startedAt` and `finishedAt` (or current time if running)
  - [x] Map `status.nodes` to `NodeStatusSummary[]` — extract only `displayName` and `phase` per node
  - [x] Handle missing/undefined fields gracefully (default phase to `'Pending'`, empty nodes array, etc.)
  - [x] Implement `mapCrdListToWorkflowSummaries(rawList: any): WorkflowSummary[]` for batch mapping
  - [x] Add `@public` JSDoc tags and Alithya license header

- [x] Task 2: Create `mappers/workflowMapper.test.ts` — mapper unit tests (AC: #2, #9)
  - [x] Test complete CRD mapping with all fields present
  - [x] Test mapping with missing `status` (brand new workflow)
  - [x] Test mapping with missing `status.nodes` (workflow with no node data)
  - [x] Test mapping with empty `status.nodes` map
  - [x] Test duration computation: finishedAt present → compute difference
  - [x] Test duration computation: running workflow (no finishedAt) → undefined duration
  - [x] Test `NodeStatusSummary` extraction — only `displayName` and `phase` fields
  - [x] Test batch mapping with multiple CRDs
  - [x] Test handling of malformed CRD data (missing metadata, etc.)

- [x] Task 3: Create `service/ArgoWorkflowsService.ts` — K8s CRD fetching service (AC: #1, #3, #4, #5, #6, #7)
  - [x] Create `service/` directory with `index.ts` barrel export
  - [x] Define `ArgoWorkflowsServiceOptions` interface with `logger`, `config`
  - [x] Implement `listWorkflows(namespace, options?)` method
  - [x] Build K8s API URL: `/apis/argoproj.io/v1alpha1/namespaces/${namespace}/workflows`
  - [x] Append `labelSelector` query param when provided
  - [x] Append `limit` and `continue` query params for K8s-native pagination
  - [x] Use `node-fetch` or the built-in `fetch` to call the K8s API via the configured cluster
  - [x] Transform raw CRD list response using `mapCrdListToWorkflowSummaries`
  - [x] Implement offset-based pagination on top of K8s `limit`/`continue` (K8s uses continuation tokens, we expose offset)
  - [x] Map K8s API errors to typed `ErrorResponse`: 403 → 403, 404 → 404, timeout → 504, 500 → 502
  - [x] Add `@public` JSDoc tags and Alithya license header

- [x] Task 4: Create `service/ArgoWorkflowsService.test.ts` — service unit tests (AC: #3, #4, #5, #6, #7, #9)
  - [x] Mock the K8s API fetch calls
  - [x] Test successful workflow list fetch and transformation
  - [x] Test `labelSelector` query parameter is passed correctly
  - [x] Test `limit` and `offset` pagination parameters
  - [x] Test 403 K8s error → HTTP 403 with actionable message
  - [x] Test 404 K8s error → HTTP 404 with namespace guidance
  - [x] Test K8s timeout → HTTP 504 with retry guidance
  - [x] Test K8s 500 → HTTP 502 with cluster configuration guidance
  - [x] Test empty workflow list response

- [x] Task 5: Update `router.ts` — add workflow list route (AC: #1, #3, #4, #8)
  - [x] Add `GET /workflows/:namespace` route
  - [x] Extract `labelSelector`, `limit`, `offset` from `req.query`
  - [x] Call `ArgoWorkflowsService.listWorkflows()` with extracted params
  - [x] Return `WorkflowSummary[]` as JSON response
  - [x] Add error handling: catch service errors and return `ErrorResponse` format
  - [x] Update `RouterOptions` to include `config` and `httpAuth`

- [x] Task 6: Update `plugin.ts` — add `httpAuth` and `config` deps (AC: #8)
  - [x] Add `httpAuth: coreServices.httpAuth` to plugin deps
  - [x] Add `config: coreServices.rootConfig` to plugin deps
  - [x] Pass `httpAuth` and `config` to `createRouter`
  - [x] Keep existing `addAuthPolicy` for `/health` (unauthenticated)
  - [x] All other routes (including `/workflows/:namespace`) require auth by default

- [x] Task 7: Update `router.test.ts` — add workflow list route tests (AC: #1, #8, #9)
  - [x] Test `GET /workflows/production` returns 200 with `WorkflowSummary[]`
  - [x] Test `GET /workflows/production?labelSelector=app%3Dmy-service` passes label selector
  - [x] Test `GET /workflows/production?limit=10&offset=0` passes pagination params
  - [x] Test error responses return `ErrorResponse` format
  - [x] Test existing `/health` endpoint still works
  - [x] Mock `ArgoWorkflowsService` for route-level tests

- [x] Task 8: Verify build and lint (AC: all)
  - [x] Run `yarn backstage-cli package build` — must succeed
  - [x] Run `yarn backstage-cli package lint` — must pass (use --fix for headers)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass

## Dev Notes

### CRITICAL: K8s API Access Strategy

The architecture specifies using `@backstage/plugin-kubernetes-node` for K8s access. However, this package is NOT currently installed in the workspace. There are two viable approaches:

**Approach A: Direct K8s API fetch (RECOMMENDED for MVP)**
The backend service makes direct HTTP calls to the K8s API server using the cluster configuration from `app-config.yaml`. This is simpler and avoids adding a heavy dependency on the full K8s backend plugin infrastructure.

**Approach B: Use `@backstage/plugin-kubernetes-node` extension points**
This requires adding `@backstage/plugin-kubernetes-backend` to the dev backend and `@backstage/plugin-kubernetes-node` to the backend plugin. This is the "proper" Backstage way but adds significant complexity for MVP.

**Decision for dev agent: Use Approach A.** Create an `ArgoWorkflowsService` that reads K8s cluster config from `app-config.yaml` and makes direct fetch calls. The service should be designed so it can be swapped to use the K8s node plugin in Phase 2 without changing the router or mapper layers.

### K8s API URL Pattern

```
GET /apis/argoproj.io/v1alpha1/namespaces/{namespace}/workflows
  ?labelSelector=app%3Dmy-service
  &limit=20
  &continue={continuation_token}
```

The K8s API returns:
```json
{
  "apiVersion": "argoproj.io/v1alpha1",
  "kind": "WorkflowList",
  "metadata": {
    "continue": "eyJ2IjoibWV0YS5rOHMuaW8vdjEiLCJydiI6...",
    "resourceVersion": "12345"
  },
  "items": [
    {
      "metadata": {
        "name": "my-workflow-abc123",
        "namespace": "production",
        "labels": { "app": "my-service" },
        "creationTimestamp": "2026-04-18T14:22:54Z"
      },
      "status": {
        "phase": "Succeeded",
        "startedAt": "2026-04-18T14:22:54Z",
        "finishedAt": "2026-04-18T14:26:41Z",
        "nodes": {
          "my-workflow-abc123": {
            "id": "my-workflow-abc123",
            "displayName": "my-workflow-abc123",
            "type": "DAG",
            "phase": "Succeeded",
            "startedAt": "2026-04-18T14:22:54Z",
            "finishedAt": "2026-04-18T14:26:41Z",
            "children": ["my-workflow-abc123-step1"]
          },
          "my-workflow-abc123-step1": {
            "id": "my-workflow-abc123-step1",
            "displayName": "build",
            "type": "Pod",
            "phase": "Succeeded",
            "startedAt": "2026-04-18T14:22:55Z",
            "finishedAt": "2026-04-18T14:25:30Z"
          }
        }
      }
    }
  ]
}
```

### WorkflowSummary Mapping Rules

From the common package `types.ts`:
```typescript
interface WorkflowSummary {
  name: string;           // ← metadata.name
  namespace: string;      // ← metadata.namespace
  phase: WorkflowPhase;   // ← status.phase (default 'Pending' if missing)
  startedAt: string;      // ← status.startedAt (ISO 8601)
  finishedAt?: string;    // ← status.finishedAt (ISO 8601, optional)
  duration?: number;      // ← computed: (finishedAt - startedAt) in seconds
  labels?: Record<string, string>; // ← metadata.labels
  nodes: NodeStatusSummary[];      // ← status.nodes mapped to {displayName, phase} only
}
```

### NodeStatusSummary Extraction

For the list view, we only need lightweight node summaries (for NodeStatusDots in Epic 3):
```typescript
interface NodeStatusSummary {
  displayName: string;  // ← node.displayName
  phase: NodePhase;     // ← node.phase
}
```

Extract from `status.nodes` map — iterate values, pick `displayName` and `phase` only. Skip boundary nodes (type DAG/Steps/StepGroup) — only include execution nodes (Pod, HTTP, Suspend, etc.).

### ErrorResponse Format (MANDATORY)

All errors MUST use this format per architecture:
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}
```

Error mapping table:
| K8s Error | HTTP Status | Code | Message |
|-----------|-------------|------|---------|
| 403 Forbidden | 403 | `FORBIDDEN` | "Access denied to namespace '{ns}'. The Backstage service account needs 'get' and 'list' permissions on 'workflows.argoproj.io'." |
| 404 Not Found | 404 | `NOT_FOUND` | "Namespace '{ns}' not found. Check the 'backstage.io/kubernetes-namespace' annotation on your entity." |
| Timeout | 504 | `GATEWAY_TIMEOUT` | "Kubernetes API request timed out. The cluster may be unreachable. Try again later." |
| 500 Internal | 502 | `BAD_GATEWAY` | "Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration." |

### Pagination Strategy

K8s API uses `limit` + `continue` token pagination. Our API exposes `limit` + `offset` for simplicity. For MVP, implement simple offset-based pagination:
- If `offset` > 0, fetch all items up to `offset + limit` and slice
- This is acceptable for MVP since workflow lists are typically < 100 items
- Phase 2 can optimize with K8s continuation tokens if needed

### httpAuth Pattern

The route needs Backstage authentication. Pattern from architecture:
```typescript
router.get('/workflows/:namespace', async (req, res) => {
  // httpAuth middleware is applied automatically by Backstage
  // for routes without an explicit addAuthPolicy
  const { namespace } = req.params;
  const labelSelector = req.query.labelSelector as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  // ...
});
```

In the new backend system, all routes require auth by default unless `addAuthPolicy` is used. We already have `addAuthPolicy` for `/health`. The `/workflows/:namespace` route will require auth automatically.

### Service Design for Testability

The `ArgoWorkflowsService` should accept a `fetch` function in its constructor so it can be mocked in tests:

```typescript
export interface ArgoWorkflowsServiceOptions {
  logger: LoggerService;
  config: RootConfigService;
  fetchFn?: typeof fetch; // injectable for testing
}
```

For MVP, the service reads K8s cluster config from `app-config.yaml`:
```yaml
kubernetes:
  clusterLocatorMethods:
    - type: config
      clusters:
        - url: https://kubernetes.default.svc
          name: local
          authProvider: serviceAccount
          serviceAccountToken: ${K8S_TOKEN}
```

However, since the dev environment won't have a real K8s cluster, the service should be designed so the router tests can mock the service entirely.

### File Locations

- `plugins/argo-workflows-backend/src/mappers/workflowMapper.ts` — NEW
- `plugins/argo-workflows-backend/src/mappers/workflowMapper.test.ts` — NEW
- `plugins/argo-workflows-backend/src/mappers/index.ts` — NEW
- `plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.ts` — NEW
- `plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.test.ts` — NEW
- `plugins/argo-workflows-backend/src/service/index.ts` — NEW
- `plugins/argo-workflows-backend/src/router.ts` — UPDATE
- `plugins/argo-workflows-backend/src/router.test.ts` — UPDATE
- `plugins/argo-workflows-backend/src/plugin.ts` — UPDATE
- `plugins/argo-workflows-backend/src/index.ts` — UPDATE (if needed)

### Dependencies

The backend plugin `package.json` already has:
- `@backstage/backend-plugin-api` — for `coreServices`, `createBackendPlugin`, `LoggerService`
- `@backstage/config` — for `RootConfigService`
- `express` and `express-promise-router` — for routing
- `supertest` (devDep) — for testing

May need to add:
- `@backstage/backend-plugin-api` already provides `HttpAuthService` — no new dep needed
- `node-fetch` is NOT needed — use global `fetch` (Node 18+ has native fetch)

Do NOT add `@backstage/plugin-kubernetes-node` or `@backstage/plugin-kubernetes-backend` — those are Phase 2.

### Architecture Constraints

- New backend system ONLY — `createBackendPlugin` with `coreServices`
- All routes except `/health` require Backstage `httpAuth` authentication
- Backend transforms raw CRD → typed `WorkflowSummary` (frontend never sees raw CRDs)
- `ErrorResponse` format for ALL errors — never return plain strings
- camelCase JSON fields in responses — never snake_case
- ISO 8601 dates in API — never timestamps or formatted strings
- Duration as seconds (number) — frontend formats for display
- Import types from `@backstage-community/plugin-argo-workflows-common`

### Previous Story Learnings (from Epic 1)

- License headers must be "The Alithya Authors" 2026 — run `yarn lint --fix` to auto-correct
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- Tests are co-located with source files — no `__tests__/` directory
- Pre-existing ESLint conflict: frontend plugin's `.eslintrc.js` conflicts with root `.eslintrc.cjs` — backend plugin lints clean
- `@public` JSDoc tags on all exported symbols

### What NOT to Do

- Do NOT add `@backstage/plugin-kubernetes-node` dependency — use direct fetch for MVP
- Do NOT add `@backstage/plugin-kubernetes-backend` to the dev backend
- Do NOT implement the `/workflows/:namespace/:name` detail route — that's Story 3.1
- Do NOT implement any frontend components — this is backend only
- Do NOT add WebSocket or SSE support — that's Phase 2+
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT use MUI or React in the backend package
- Do NOT modify the common package types — they are complete from Story 1.2
- Do NOT implement real K8s cluster connectivity in tests — mock everything

### Testing Strategy

**Mapper tests:** Pure function tests with fixture data. Create realistic CRD fixtures based on the K8s API response format documented above.

**Service tests:** Mock the `fetch` function. Test that the service constructs correct K8s API URLs, passes query params, and maps errors correctly.

**Router tests:** Mock the `ArgoWorkflowsService`. Test that routes extract params correctly, call the service, and return proper responses. Use `supertest` for HTTP-level testing.

### References

- [Source: architecture.md#Data Architecture] — CRD transformation strategy, WorkflowSummary type
- [Source: architecture.md#API & Communication Patterns] — REST routes table, error mapping
- [Source: architecture.md#Authentication & Security] — httpAuth on all routes except /health
- [Source: architecture.md#Implementation Patterns] — naming conventions, ErrorResponse format
- [Source: architecture.md#Structure Patterns] — backend file structure (service/, mappers/)
- [Source: epics.md#Story 2.1] — acceptance criteria and story statement
- [Source: research doc#Argo Workflows CRD Structure] — K8s API response format, status.nodes schema
- [Source: research doc#Integration Patterns] — K8s API URL patterns, custom resource fetching
- [Source: common/types.ts] — WorkflowSummary, NodeStatusSummary, WorkflowPhase, NodePhase types
- [Source: common/annotations.ts] — annotation constants
- [Source: _bmad-output/implementation-artifacts/1-4-backend-plugin-skeleton-with-health-check.md] — previous backend story learnings

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `mappers/workflowMapper.ts` with `mapCrdToWorkflowSummary` and `mapCrdListToWorkflowSummaries` — transforms raw K8s CRDs to typed `WorkflowSummary` objects, filters boundary nodes from NodeStatusSummary, handles missing/malformed data gracefully
- Created `mappers/workflowMapper.test.ts` with 15 tests covering all mapping scenarios
- Created `service/ArgoWorkflowsService.ts` with direct K8s API fetch, cluster config from `app-config.yaml`, injectable `fetchFn` for testability, error mapping (403/404/timeout/500), offset-based pagination
- Created `service/ArgoWorkflowsService.test.ts` with 12 tests covering success, error mapping, pagination, and network failures
- Updated `router.ts` with `GET /workflows/:namespace` route, `ErrorResponse` format for all errors, `RouterOptions` now includes `config` and `httpAuth`
- Updated `plugin.ts` with `httpAuth` and `config` deps passed to `createRouter`
- Updated `router.test.ts` with 8 tests (2 health + 6 workflow route) using mocked service
- All 35 tests pass, build succeeds, lint clean
- No new dependencies added — uses native `fetch` (Node 18+)

### File List

workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/workflowMapper.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/workflowMapper.test.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/mappers/index.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/service/ArgoWorkflowsService.test.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/service/index.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.test.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/plugin.ts
