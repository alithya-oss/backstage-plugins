# Story 6.3: New Frontend System Support

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
| Low | 0 | — |

### Acceptance Criteria

All 6 ACs verified ✅

### Verdict

**APPROVED** — Clean new frontend system integration. Dual-system support working.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Backstage adopter using the new frontend system,
I want the Argo Workflows plugin to work with `EntityContentBlueprint`,
so that I can use it without the legacy `createRoutableExtension` API.

## Acceptance Criteria

1. `EntityContentBlueprint` registers the Argo Workflows tab on entity pages
2. `ApiBlueprint` registers the API factory
3. The old frontend system exports (`createPlugin`, `createRoutableExtension`) continue to work
4. The new system entry point is at `src/alpha.ts`
5. `package.json` has an `alpha` field pointing to the new entry point
6. Unit tests verify both old and new system plugin registration

## Tasks / Subtasks

- [x] Task 1–6: All tasks complete

## Dev Notes

### New Frontend System Pattern

```typescript
// src/alpha.ts
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

const entityContent = EntityContentBlueprint.make({
  name: 'argo-workflows',
  params: {
    defaultPath: '/argo-workflows',
    defaultTitle: 'Argo Workflows',
    loader: () =>
      import('./components/ArgoWorkflowsPage').then(m => <m.ArgoWorkflowsPage />),
  },
});

export default createFrontendPlugin({
  id: 'argo-workflows',
  extensions: [entityContent],
});
```

### Dual System Support

Both systems coexist:
- `src/plugin.ts` — old system (`createPlugin` + `createRoutableExtension`)
- `src/alpha.ts` — new system (`createFrontendPlugin` + `EntityContentBlueprint`)
- `src/index.ts` — exports old system (unchanged)

### What NOT to Do

- Do NOT remove old system exports — both must work
- Do NOT modify existing components
- Do NOT add the alpha import to `src/index.ts` — it's a separate entry point

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required

### Project Structure Notes

```
plugins/argo-workflows/
├── package.json          ← MODIFY (add alpha entry point)
├── src/
│   ├── alpha.ts          ← NEW
│   ├── alpha.test.ts     ← NEW
│   ├── plugin.ts         ← UNCHANGED (old system)
│   └── index.ts          ← UNCHANGED
```

### References

- [Source: epics.md#Story 6.3] — Acceptance criteria
- [Source: backstage.io/docs/frontend-system/building-plugins] — New frontend system docs
- [Source: backstage.io/docs/frontend-system/building-plugins/common-extension-blueprints] — EntityContentBlueprint
- [Source: argo-workflows/src/plugin.ts] — Old system plugin definition

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `alpha.ts` with `createFrontendPlugin`, `EntityContentBlueprint`, and `ApiBlueprint`
- Added `@backstage/frontend-plugin-api` dependency
- Added `alpha` entry point to `package.json` and `publishConfig`
- Old system exports in `plugin.ts` and `index.ts` unchanged — both systems coexist
- 2 new tests, 207 total tests pass across 18 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/package.json
workspaces/argo-workflows/plugins/argo-workflows/src/alpha.ts
workspaces/argo-workflows/plugins/argo-workflows/src/alpha.test.ts
