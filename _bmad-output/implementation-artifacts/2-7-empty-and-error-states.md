# Story 2.7: Empty and Error States

Status: done

## Story

As a platform engineer,
I want clear, actionable messages when workflows can't be loaded or don't exist,
so that I can diagnose configuration issues without guessing.

## Acceptance Criteria

1. When no workflows are found, a styled info alert displays "No Argo Workflows found in namespace `{ns}`." (with label selector if present)
2. When the entity has no namespace annotation, a styled warning alert displays "No Argo Workflows annotations found on this entity. Add `backstage.io/kubernetes-namespace` to your catalog-info.yaml."
3. When the backend returns a 403 error, a styled danger alert displays "Access denied. The Backstage service account needs `get` and `list` permissions on `workflows.argoproj.io`."
4. When the backend returns a 502/504 error, a styled danger alert displays "Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration."
5. A generic error fallback displays the error message for any other error type
6. Each error/empty state uses the `WorkflowEmptyState` component
7. The `ArgoWorkflowsPage` component routes errors to `WorkflowEmptyState` instead of the current plain `<div>`
8. Unit tests verify each error type renders the correct message and severity

## Tasks / Subtasks

- [x] Task 1: Create `components/EmptyState/WorkflowEmptyState.tsx` (AC: #1, #2, #3, #4, #5, #6)
  - [x] Define `WorkflowEmptyStateProps` interface: `{ error?: Error | null; namespace?: string; labelSelector?: string; workflowCount?: number; }`
  - [x] Create internal `classifyError` function that inspects the error to determine the alert type:
    - Missing annotation error (message contains `backstage.io/kubernetes-namespace`) → `warning` severity
    - `ArgoWorkflowsError` with `statusCode === 403` → `danger` severity
    - `ArgoWorkflowsError` with `statusCode === 502 || statusCode === 504` → `danger` severity
    - Any other error → `danger` severity with generic message
    - No error + `workflowCount === 0` → `info` severity (empty state)
  - [x] Render a styled alert div with severity-based BUI CSS custom properties
  - [x] Include the specific actionable message for each error type per AC
  - [x] Add `role="alert"` for danger/warning alerts, `role="status"` for info
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 2: Create `components/EmptyState/WorkflowEmptyState.module.css` (AC: #6)
  - [x] `.alert` — base alert: `padding: var(--bui-space-4)`, `border-radius: 4px`, `border-left: 4px solid`
  - [x] `.alertInfo` — `background: var(--bui-bg-info)`, `border-color: var(--bui-fg-info)`, `color: var(--bui-fg-default)`
  - [x] `.alertWarning` — `background: var(--bui-bg-warning)`, `border-color: var(--bui-fg-warning)`, `color: var(--bui-fg-default)`
  - [x] `.alertDanger` — `background: var(--bui-bg-danger)`, `border-color: var(--bui-fg-danger)`, `color: var(--bui-fg-default)`
  - [x] `.alertTitle` — `font-weight: 600`, `margin-bottom: var(--bui-space-1)`
  - [x] `.alertMessage` — `font-size: 14px`
  - [x] `.code` — inline code style: `font-family: monospace`, `background: var(--bui-bg-neutral-2)`, `padding: 1px 4px`, `border-radius: 2px`

- [x] Task 3: Create `components/EmptyState/index.ts` — barrel export
  - [x] Export `WorkflowEmptyState` and `WorkflowEmptyStateProps`

- [x] Task 4: Update `ArgoWorkflowsPage.tsx` to use `WorkflowEmptyState` (AC: #7)
  - [x] Import `WorkflowEmptyState` from `./EmptyState`
  - [x] Read namespace and labelSelector from entity annotations for passing to empty state
  - [x] Replace the plain `<div>Error: {error.message}</div>` with `<WorkflowEmptyState error={error} namespace={namespace} labelSelector={labelSelector} />`
  - [x] Add empty state check: when `!loading && !error && workflows.length === 0`, render `<WorkflowEmptyState workflowCount={0} namespace={namespace} labelSelector={labelSelector} />`

- [x] Task 5: Create `components/EmptyState/WorkflowEmptyState.test.tsx` (AC: #8)
  - [x] Test: renders info alert when no workflows found (workflowCount=0, no error)
  - [x] Test: info alert includes namespace in message
  - [x] Test: info alert includes label selector when provided
  - [x] Test: renders warning alert for missing annotation error
  - [x] Test: warning alert mentions `backstage.io/kubernetes-namespace`
  - [x] Test: renders danger alert for 403 error (ArgoWorkflowsError with statusCode 403)
  - [x] Test: 403 alert mentions RBAC permissions
  - [x] Test: renders danger alert for 502 error (ArgoWorkflowsError with statusCode 502)
  - [x] Test: renders danger alert for 504 error (ArgoWorkflowsError with statusCode 504)
  - [x] Test: 502/504 alert mentions Kubernetes cluster connectivity
  - [x] Test: renders generic danger alert for unknown errors
  - [x] Test: returns null when no error and workflowCount > 0

- [x] Task 6: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass
  - [x] Run `yarn backstage-cli package build` — must succeed

## Dev Notes

### Architecture Contract

From architecture.md — `WorkflowEmptyState` lives in its own `EmptyState/` directory:
```
plugins/argo-workflows/src/components/EmptyState/
├── WorkflowEmptyState.tsx       ← NEW
├── WorkflowEmptyState.test.tsx  ← NEW
├── WorkflowEmptyState.module.css ← NEW
└── index.ts                     ← NEW
```

Also update:
- `components/ArgoWorkflowsPage.tsx` — replace plain error div with `WorkflowEmptyState`

### Error Classification Logic

The `WorkflowEmptyState` component inspects the error object to determine what message to show. The `ArgoWorkflowsError` class (from `api/ArgoWorkflowsApiClient.ts`) has `code` and `statusCode` properties that enable classification:

```typescript
import { ArgoWorkflowsError } from '../../api';

type AlertSeverity = 'info' | 'warning' | 'danger';

interface ClassifiedError {
  severity: AlertSeverity;
  title: string;
  message: string;
}

function classifyError(error: Error, namespace?: string, labelSelector?: string): ClassifiedError {
  // Missing annotation — useArgoWorkflows sets this error message
  if (error.message.includes('backstage.io/kubernetes-namespace')) {
    return {
      severity: 'warning',
      title: 'Missing Configuration',
      message: 'No Argo Workflows annotations found on this entity. Add backstage.io/kubernetes-namespace to your catalog-info.yaml.',
    };
  }

  // ArgoWorkflowsError with statusCode
  if (error instanceof ArgoWorkflowsError) {
    if (error.statusCode === 403) {
      return {
        severity: 'danger',
        title: 'Access Denied',
        message: 'The Backstage service account needs get and list permissions on workflows.argoproj.io.',
      };
    }
    if (error.statusCode === 502 || error.statusCode === 504) {
      return {
        severity: 'danger',
        title: 'Cluster Unreachable',
        message: 'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
      };
    }
  }

  // Generic fallback
  return {
    severity: 'danger',
    title: 'Error',
    message: error.message,
  };
}
```

### Empty State (No Workflows Found)

When `workflowCount === 0` and there's no error, show an info alert:

```
No Argo Workflows found in namespace `production`.
```

Or with label selector:

```
No Argo Workflows found in namespace `production` matching label selector `app=my-service`.
```

### ArgoWorkflowsPage Integration

The `ArgoWorkflowsPage` currently has a simple error div. Replace it with proper routing:

```typescript
const { entity } = useEntity();
const { workflows, loading, error, lastUpdated } = useArgoWorkflows(entity);

const namespace = entity.metadata.annotations?.['backstage.io/kubernetes-namespace']?.trim();
const labelSelector = entity.metadata.annotations?.['backstage.io/kubernetes-label-selector']?.trim();

// Error state
if (error) {
  return <WorkflowEmptyState error={error} namespace={namespace} labelSelector={labelSelector} />;
}

// Empty state (no workflows, not loading)
if (!loading && workflows.length === 0) {
  return <WorkflowEmptyState workflowCount={0} namespace={namespace} labelSelector={labelSelector} />;
}

// Normal state
return <WorkflowTable workflows={workflows} loading={loading} lastUpdated={lastUpdated} />;
```

### Alert Styling with BUI CSS Custom Properties

Use BUI tokens for alert colors — no hardcoded values, no MUI Alert component:

- Info: `background: var(--bui-bg-info)`, `border-color: var(--bui-fg-info)`
- Warning: `background: var(--bui-bg-warning)`, `border-color: var(--bui-fg-warning)`
- Danger: `background: var(--bui-bg-danger)`, `border-color: var(--bui-fg-danger)`

The alert has a 4px left border (colored by severity) and a tinted background. This matches the BUI Alert pattern used in other Backstage community plugins.

### Testing Patterns

- Use `render` from `@testing-library/react` for `WorkflowEmptyState` tests (no Backstage context needed)
- Import `ArgoWorkflowsError` from `../../api` to create typed error mocks
- Use `screen.getByRole('alert')` for danger/warning alerts
- Use `screen.getByRole('status')` for info alerts
- Use `screen.getByText(/partial text/)` for message assertions

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — known issue, ignore
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `@public` JSDoc tags required on all exported symbols
- CSS modules with BUI custom properties for themed styling
- `renderInTestApp` from `@backstage/test-utils` for component tests needing Backstage context; plain `render` for standalone components
- `ArgoWorkflowsError` has `code: string` and `statusCode: number` properties
- `useArgoWorkflows` sets a plain `Error` (not `ArgoWorkflowsError`) for missing namespace annotation — check `error.message.includes('backstage.io/kubernetes-namespace')` to detect this case
- `formatPollTime` handles invalid Date with `Number.isNaN` check (code review finding from Story 2.6)

### What NOT to Do

- Do NOT add any new npm dependencies
- Do NOT use Material UI Alert, Snackbar, or any MUI components — use plain HTML + CSS modules with BUI tokens
- Do NOT use Backstage `ResponseErrorPanel` or `WarningPanel` — use custom `WorkflowEmptyState` with BUI tokens per architecture spec
- Do NOT modify the backend plugin
- Do NOT modify the common package
- Do NOT modify the hooks — error classification happens in the component layer
- Do NOT implement error boundaries — that's Story 4.5
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT show the filter toolbar when in error/empty state — `ArgoWorkflowsPage` renders either `WorkflowEmptyState` OR `WorkflowTable`, not both
- Do NOT use `instanceof ArgoWorkflowsError` without importing the class — the import is needed for the check to work

### References

- [Source: architecture.md#Process Patterns] — three-layer error handling (backend → API client → component)
- [Source: architecture.md#Structure Patterns] — EmptyState/ directory with WorkflowEmptyState.tsx
- [Source: architecture.md#Communication Patterns] — error response format with code and statusCode
- [Source: epics.md#Story 2.7] — acceptance criteria with specific error messages
- [Source: ux-design-specification.md#Error States] — error type table with messages and severity
- [Source: ux-design-specification.md#Empty States] — "No Argo Workflows found" info alert
- [Source: api/ArgoWorkflowsApiClient.ts] — ArgoWorkflowsError class with code and statusCode

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `WorkflowEmptyState` component with `classifyError` function that maps error types to severity-specific alerts
- Four error classifications: missing annotation (warning), 403 RBAC (danger), 502/504 connectivity (danger), generic fallback (danger)
- Empty state (info) shows namespace and optional label selector in message
- CSS module with BUI custom properties for info/warning/danger alert styling (left border accent pattern)
- Updated `ArgoWorkflowsPage` to route errors and empty state to `WorkflowEmptyState` instead of plain `<div>`
- Uses `role="alert"` for danger/warning and `role="status"` for info alerts
- 12 new tests, 83 total tests pass
- Build succeeds

### Code Review Findings (Applied)

1. **Critical**: `classifyError` now guards against `error.message` being undefined/null with fallback to empty string
2. **Critical**: Generic error fallback now shows "An unknown error occurred." when message is empty
3. **Medium**: `buildEmptyMessage` now trims namespace and labelSelector before use, preventing empty string issues
4. **Tests added**: Two new tests for error with empty message and error with undefined message
5. **Final test count**: 85 tests pass

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/EmptyState/WorkflowEmptyState.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/EmptyState/WorkflowEmptyState.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/EmptyState/WorkflowEmptyState.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/EmptyState/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx
