# Story 2.2: Frontend API Client

Status: done

## Story

As a plugin developer,
I want a typed API client that calls the backend REST routes via Backstage discovery,
so that frontend components can fetch workflow data through a clean interface.

## Acceptance Criteria

1. `ArgoWorkflowsApiClient` implements the `ArgoWorkflowsApi` interface
2. `listWorkflows(namespace, labelSelector)` calls `GET /workflows/:namespace` and returns `WorkflowSummary[]`
3. `getWorkflow(namespace, name)` calls `GET /workflows/:namespace/:name` and returns `WorkflowDetail`
4. The client uses `discoveryApi` to resolve the backend URL
5. The client uses `fetchApi` for authenticated requests
6. HTTP errors are caught and thrown as `ArgoWorkflowsError` with message, code, and statusCode
7. `createApiFactory` registers the client with `argoWorkflowsApiRef`
8. Unit tests mock `fetchApi` and verify request construction and error handling

## Tasks / Subtasks

- [x] Task 1: Create `api/ArgoWorkflowsApiClient.ts` (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create `api/` directory with `index.ts` barrel export
  - [x] Define `ArgoWorkflowsError` class extending `Error` with `code` and `statusCode`
  - [x] Implement `ArgoWorkflowsApiClient` class implementing `ArgoWorkflowsApi`
  - [x] Constructor accepts `{ discoveryApi, fetchApi }`
  - [x] `listWorkflows(namespace, labelSelector?)` — builds URL via discoveryApi, appends labelSelector query param, calls fetchApi, returns `WorkflowSummary[]`
  - [x] `getWorkflow(namespace, name)` — builds URL via discoveryApi, calls fetchApi, returns `WorkflowDetail`
  - [x] Parse error responses: extract `error.message`, `error.code`, `error.statusCode` from `ErrorResponse` body
  - [x] Throw `ArgoWorkflowsError` for non-ok responses
  - [x] Add `@public` JSDoc tags and Alithya license header

- [x] Task 2: Create `api/ArgoWorkflowsApiClient.test.ts` (AC: #8)
  - [x] Mock `discoveryApi.getBaseUrl('argo-workflows')` → returns base URL
  - [x] Mock `fetchApi.fetch` for success and error responses
  - [x] Test `listWorkflows` constructs correct URL with namespace
  - [x] Test `listWorkflows` appends labelSelector query param
  - [x] Test `listWorkflows` returns parsed `WorkflowSummary[]`
  - [x] Test `getWorkflow` constructs correct URL with namespace and name
  - [x] Test `getWorkflow` returns parsed `WorkflowDetail`
  - [x] Test error response throws `ArgoWorkflowsError` with correct fields
  - [x] Test non-JSON error response throws generic error

- [x] Task 3: Update `plugin.ts` — register API factory (AC: #7)
  - [x] Import `createApiFactory`, `discoveryApiRef`, `fetchApiRef` from `@backstage/core-plugin-api`
  - [x] Import `argoWorkflowsApiRef` from common package
  - [x] Import `ArgoWorkflowsApiClient` from `./api`
  - [x] Add `apis` array to `createPlugin` with `createApiFactory` for `argoWorkflowsApiRef`

- [x] Task 4: Update `index.ts` — export API client (AC: #1)
  - [x] Export `ArgoWorkflowsApiClient` and `ArgoWorkflowsError` from `./api`

- [x] Task 5: Verify build and lint (AC: all)
  - [x] Run `yarn backstage-cli package build` — must succeed
  - [x] Run `yarn backstage-cli package lint --fix` — must pass
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass

## Dev Notes

### API Client Pattern

From architecture — the client uses Backstage's `discoveryApi` and `fetchApi`:

```typescript
import {
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';

export class ArgoWorkflowsApiClient implements ArgoWorkflowsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: { discoveryApi: DiscoveryApi; fetchApi: FetchApi }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async listWorkflows(namespace: string, labelSelector?: string): Promise<WorkflowSummary[]> {
    const baseUrl = await this.discoveryApi.getBaseUrl('argo-workflows');
    const params = new URLSearchParams();
    if (labelSelector) params.set('labelSelector', labelSelector);
    const query = params.toString();
    const url = `${baseUrl}/workflows/${encodeURIComponent(namespace)}${query ? `?${query}` : ''}`;
    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw await this.parseError(response);
    }
    return response.json();
  }
}
```

### API Factory Registration

```typescript
export const argoWorkflowsPlugin = createPlugin({
  id: 'argo-workflows',
  routes: { root: rootRouteRef },
  apis: [
    createApiFactory({
      api: argoWorkflowsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new ArgoWorkflowsApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});
```

### ArgoWorkflowsError Class

```typescript
export class ArgoWorkflowsError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = 'ArgoWorkflowsError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
```

### ErrorResponse Parsing

The backend returns errors in this format:
```json
{ "error": { "message": "...", "code": "FORBIDDEN", "statusCode": 403 } }
```

The client should try to parse this format. If the response body isn't valid JSON or doesn't match the format, fall back to a generic error with the HTTP status text.

### Backend URL Discovery

`discoveryApi.getBaseUrl('argo-workflows')` returns something like `http://localhost:7007/api/argo-workflows`. The plugin ID in the backend is `'argo-workflows'` (set in `plugin.ts`).

### getWorkflow Note

The backend `GET /workflows/:namespace/:name` route doesn't exist yet (Story 3.1). But the API client should implement it now since the `ArgoWorkflowsApi` interface requires it. The method should work correctly once the backend route is added.

### File Locations

- `plugins/argo-workflows/src/api/ArgoWorkflowsApiClient.ts` — NEW
- `plugins/argo-workflows/src/api/ArgoWorkflowsApiClient.test.ts` — NEW
- `plugins/argo-workflows/src/api/index.ts` — NEW
- `plugins/argo-workflows/src/plugin.ts` — UPDATE (add API factory)
- `plugins/argo-workflows/src/index.ts` — UPDATE (add exports)

### Dependencies

All needed dependencies are already in `package.json`:
- `@backstage/core-plugin-api` — `createApiFactory`, `discoveryApiRef`, `fetchApiRef`, `DiscoveryApi`, `FetchApi`
- `@backstage-community/plugin-argo-workflows-common` — `argoWorkflowsApiRef`, `ArgoWorkflowsApi`, types

Do NOT add any new dependencies.

### Testing Pattern

Mock `discoveryApi` and `fetchApi`:
```typescript
const mockDiscoveryApi = { getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/argo-workflows') };
const mockFetchApi = { fetch: jest.fn() };
```

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — `yarn lint` may fail due to react plugin conflict between root `.eslintrc.cjs` and plugin `.eslintrc.js`
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests

### What NOT to Do

- Do NOT add any React components — this is API client only
- Do NOT add hooks — those are Story 2.3+
- Do NOT modify the common package
- Do NOT add new npm dependencies
- Do NOT create a `__tests__/` directory — tests are co-located

### References

- [Source: architecture.md#API & Communication Patterns] — API factory, client pattern
- [Source: architecture.md#Implementation Patterns] — ErrorResponse format
- [Source: common/api.ts] — ArgoWorkflowsApi interface, argoWorkflowsApiRef
- [Source: epics.md#Story 2.2] — acceptance criteria

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `ArgoWorkflowsApiClient` implementing `ArgoWorkflowsApi` with `listWorkflows` and `getWorkflow` methods
- Created `ArgoWorkflowsError` class with `code` and `statusCode` fields
- Error parsing handles both structured `ErrorResponse` JSON and non-JSON fallback
- URL construction uses `encodeURIComponent` for namespace and name
- Registered `createApiFactory` in `plugin.ts` with `discoveryApiRef` and `fetchApiRef`
- Exported `ArgoWorkflowsApiClient` and `ArgoWorkflowsError` from `index.ts`
- 11 tests pass, build succeeds
- No new dependencies added

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/api/ArgoWorkflowsApiClient.ts
workspaces/argo-workflows/plugins/argo-workflows/src/api/ArgoWorkflowsApiClient.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/api/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/plugin.ts
workspaces/argo-workflows/plugins/argo-workflows/src/index.ts
