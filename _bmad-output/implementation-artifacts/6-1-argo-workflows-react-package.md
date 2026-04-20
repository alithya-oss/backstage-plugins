# Story 6.1: argo-workflows-react Package

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 0 | — |
| Low | 1 | Duplicated test files in both packages (acceptable for backward compat verification) |

### Acceptance Criteria

All 5 ACs verified ✅

### Verdict

**APPROVED** — Clean package extraction. ADR011 compliant. Backward compatibility maintained.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a third-party plugin developer,
I want reusable Argo Workflows hooks in a separate package,
so that I can build custom UIs without depending on the full frontend plugin.

## Acceptance Criteria

1. `useArgoWorkflows`, `useWorkflowDetail`, and `usePolling` are moved to the new package
2. The frontend plugin re-exports all hooks from `argo-workflows-react` for backward compatibility
3. The package has its own `package.json`, `tsconfig.json`, and `report.api.md`
4. `yarn build` succeeds for the new package and the frontend plugin
5. All existing tests pass without modification (imports resolve through re-exports)

## Tasks / Subtasks

- [x] Task 1: Scaffold `argo-workflows-react` package (AC: #3)
- [x] Task 2: Move hooks to the react package (AC: #1)
- [x] Task 3: Update frontend plugin to re-export from react package (AC: #2)
- [x] Task 4: Update pluginPackages in all package.json files (AC: #3)
- [x] Task 5: Verify build and tests (AC: #4, #5)

## Dev Notes

### ADR011 Package Role

Per ADR011, `x-react` packages have role `web-library`:
- Contains shared widgets, hooks, and similar
- Both the plugin itself (`x`) and third-party frontend plugins can depend on it
- Does NOT contain full components or pages — just reusable primitives

### Dependency Graph After This Story

```
common ← react ← frontend
common ← backend
```

### What Moves vs What Stays

| Hook | Moves to react? | Reason |
|------|----------------|--------|
| `usePolling` | ✅ Yes | Generic, reusable |
| `useArgoWorkflows` | ✅ Yes | Entity-based data fetching |
| `useWorkflowDetail` | ✅ Yes | Workflow detail fetching |
| `useDAGWithGroups` | ❌ No | Depends on dagre (frontend-only concern) |

### Re-export Pattern

```typescript
// plugins/argo-workflows/src/hooks/usePolling.ts (after move)
export { usePolling } from '@backstage-community/plugin-argo-workflows-react';
```

This ensures all existing imports from `../../hooks` continue to work.

### What NOT to Do

- Do NOT move `useDAGWithGroups` — it depends on dagre and is frontend-specific
- Do NOT move components — only hooks go in the react package
- Do NOT break existing imports — re-exports maintain backward compatibility
- Do NOT modify the backend or common package (except pluginPackages)

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required
- Tekton react package uses `role: "web-library"` — follow same pattern

### Project Structure Notes

```
plugins/
├── argo-workflows-react/          ← NEW PACKAGE
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── setupTests.ts
│   │   ├── usePolling.ts
│   │   ├── usePolling.test.ts
│   │   ├── useArgoWorkflows.ts
│   │   ├── useArgoWorkflows.test.ts
│   │   ├── useWorkflowDetail.ts
│   │   └── useWorkflowDetail.test.ts
├── argo-workflows/
│   ├── src/hooks/
│   │   ├── usePolling.ts          ← RE-EXPORT from react package
│   │   ├── useArgoWorkflows.ts    ← RE-EXPORT from react package
│   │   ├── useWorkflowDetail.ts   ← RE-EXPORT from react package
│   │   ├── useDAGWithGroups.ts    ← STAYS (dagre dependency)
│   │   └── index.ts              ← UNCHANGED
```

### References

- [Source: epics.md#Story 6.1] — Acceptance criteria
- [Source: ADR011] — Plugin package structure, web-library role
- [Source: tekton-react/package.json] — Pattern to follow
- [Source: argo-workflows/src/hooks/] — Hooks to move

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Scaffolded `argo-workflows-react` package with `role: "web-library"` per ADR011
- Moved `usePolling`, `useArgoWorkflows`, `useWorkflowDetail` + tests to react package
- Frontend plugin re-exports all hooks for backward compatibility
- Updated `pluginPackages` in all 4 package.json files
- Required `yarn tsc` before `yarn backstage-cli package build` to generate declaration files
- React package: 3 suites, 39 tests pass
- Frontend plugin: 17 suites, 205 tests pass (unchanged)
- Both packages build successfully

### File List

workspaces/argo-workflows/plugins/argo-workflows-react/package.json
workspaces/argo-workflows/plugins/argo-workflows-react/tsconfig.json
workspaces/argo-workflows/plugins/argo-workflows-react/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/setupTests.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/usePolling.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/usePolling.test.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/useArgoWorkflows.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/useArgoWorkflows.test.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/useWorkflowDetail.ts
workspaces/argo-workflows/plugins/argo-workflows-react/src/useWorkflowDetail.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/usePolling.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useArgoWorkflows.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useWorkflowDetail.ts
workspaces/argo-workflows/plugins/argo-workflows/package.json
workspaces/argo-workflows/plugins/argo-workflows-common/package.json
workspaces/argo-workflows/plugins/argo-workflows-backend/package.json
