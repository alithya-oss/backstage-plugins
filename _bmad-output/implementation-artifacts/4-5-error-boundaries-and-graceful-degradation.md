# Story 4.5: Error Boundaries and Graceful Degradation

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 1 | Hook errors not caught by component-level boundary (React limitation, caught by Backstage app boundary) |
| Low | 2 | No reset mechanism, stale closure in DAG fallback |

### Acceptance Criteria

All 5 ACs verified ✅

### Verdict

**APPROVED** — Error boundaries correctly placed at three levels. All acceptance criteria satisfied.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want the plugin to handle rendering failures gracefully without crashing the entire Backstage page,
so that a bug in one component doesn't break my developer portal.

## Acceptance Criteria

1. When the `DAGCardFlow` component throws a rendering error, an error boundary catches it and displays: "Unable to render workflow graph. Showing metadata only." with a fallback metadata list (name, phase, start time, finish time, duration)
2. When the `NodeDetailPanel` throws a rendering error, the panel shows "Unable to display node details" without affecting the DAG view
3. When the `WorkflowTable` throws a rendering error, the tab shows "Something went wrong loading Argo Workflows. Try refreshing the page." with a refresh link
4. Error boundaries log the error to the console for debugging
5. Unit tests verify each error boundary catches errors and renders the correct fallback

## Tasks / Subtasks

- [x] Task 1: Create a reusable `ErrorBoundary` component (AC: #4)
  - [x] Create file `plugins/argo-workflows/src/components/ErrorBoundary/ErrorBoundary.tsx`
  - [x] Create `plugins/argo-workflows/src/components/ErrorBoundary/index.ts` barrel export
  - [x] Add Alithya license header
  - [x] Implement as a React class component (error boundaries require `componentDidCatch`)
  - [x] Props: `fallback: React.ReactNode` (what to render on error)
  - [x] Log error to `console.error` in `componentDidCatch`
  - [x] Add `@public` JSDoc tag

- [x] Task 2: Wrap `DAGCardFlow` in error boundary (AC: #1)
  - [x] Modify `WorkflowExpandableRow.tsx`:
    - Import `ErrorBoundary`
    - Wrap `<DAGCardFlow>` in `<ErrorBoundary fallback={<DAGFallback workflow={detail} />}>`
  - [x] Create a `DAGFallback` component inline or as a small helper:
    - Shows "Unable to render workflow graph. Showing metadata only."
    - Renders a simple metadata list: name, phase, startedAt, finishedAt, duration

- [x] Task 3: Wrap `NodeDetailPanel` in error boundary (AC: #2)
  - [x] Modify `WorkflowExpandableRow.tsx`:
    - Wrap `<NodeDetailPanel>` in `<ErrorBoundary fallback={<span>Unable to display node details</span>}>`

- [x] Task 4: Wrap `WorkflowTable` in error boundary (AC: #3)
  - [x] Modify `ArgoWorkflowsPage.tsx`:
    - Import `ErrorBoundary`
    - Wrap the entire return content in `<ErrorBoundary fallback={<PageFallback />}>`
    - `PageFallback`: "Something went wrong loading Argo Workflows." with a refresh link (`window.location.reload()`)

- [x] Task 5: Create tests (AC: #5)
  - [x] Create `plugins/argo-workflows/src/components/ErrorBoundary/ErrorBoundary.test.tsx`
  - [x] Test: renders children when no error
  - [x] Test: renders fallback when child throws
  - [x] Test: logs error to console.error
  - [x] Test: DAG error boundary shows fallback metadata
  - [x] Test: NodeDetailPanel error boundary shows "Unable to display node details"
  - [x] Test: Page error boundary shows refresh message

- [x] Task 6: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests pass
  - [x] Run `yarn backstage-cli package build` — succeeds

## Dev Notes

### Error Boundary Pattern

React error boundaries must be class components:

```typescript
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[argo-workflows]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

### Boundary Placement

```
ArgoWorkflowsPage
  └── ErrorBoundary (page-level: "Something went wrong...")
        └── WorkflowTable
              └── WorkflowExpandedContent
                    ├── ErrorBoundary (DAG: "Unable to render workflow graph...")
                    │     └── DAGCardFlow
                    └── ErrorBoundary (panel: "Unable to display node details")
                          └── NodeDetailPanel
```

### DAG Fallback Component

When the DAG fails to render, show basic workflow metadata:

```tsx
function DAGFallback({ workflow }: { workflow: WorkflowDetail }) {
  return (
    <div>
      <p>Unable to render workflow graph. Showing metadata only.</p>
      <dl>
        <dt>Name</dt><dd>{workflow.name}</dd>
        <dt>Phase</dt><dd>{workflow.phase}</dd>
        <dt>Started</dt><dd>{workflow.startedAt}</dd>
        <dt>Finished</dt><dd>{workflow.finishedAt ?? '—'}</dd>
        <dt>Duration</dt><dd>{formatDuration(workflow.duration)}</dd>
      </dl>
    </div>
  );
}
```

### Testing Error Boundaries

Suppress React's error logging in tests to avoid noisy output:

```typescript
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore();
});
```

Use a component that throws to trigger the boundary:

```typescript
function ThrowingComponent(): JSX.Element {
  throw new Error('Test error');
}
```

### What NOT to Do

- Do NOT use `try/catch` in render — only class component error boundaries catch render errors
- Do NOT add error boundaries around hooks — they only catch errors in the render tree
- Do NOT modify the backend or common package
- Do NOT add new npm dependencies (no `react-error-boundary` — keep it simple)

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Pre-existing test failures — unrelated, ignore

### Project Structure Notes

```
plugins/argo-workflows/src/components/
├── ErrorBoundary/
│   ├── index.ts                    ← NEW
│   ├── ErrorBoundary.tsx           ← NEW
│   └── ErrorBoundary.test.tsx      ← NEW
├── WorkflowTable/
│   └── WorkflowExpandableRow.tsx   ← MODIFY (wrap DAG + panel)
├── ArgoWorkflowsPage.tsx           ← MODIFY (wrap page content)
```

### References

- [Source: epics.md#Story 4.5] — Acceptance criteria
- [Source: architecture.md#Process Patterns] — Three-layer error handling
- [Source: argo-workflows/src/components/ArgoWorkflowsPage.tsx] — Page component to wrap
- [Source: argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx] — DAG + panel to wrap

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created reusable `ErrorBoundary` class component with `fallback` prop and `console.error` logging
- Wrapped `DAGCardFlow` in error boundary with metadata fallback (name, phase, timing)
- Wrapped `NodeDetailPanel` in error boundary with "Unable to display node details" fallback
- Wrapped page content in `ArgoWorkflowsPage` with refresh button fallback
- 6 new tests, 166 total tests pass across 12 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/ErrorBoundary/ErrorBoundary.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/ErrorBoundary/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/ErrorBoundary/ErrorBoundary.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx
