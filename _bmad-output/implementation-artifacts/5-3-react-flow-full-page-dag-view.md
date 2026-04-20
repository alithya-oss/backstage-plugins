# Story 5.3: React Flow Full-Page DAG View

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 1 | Unused PHASE_STATUS_MAP import — FIXED |
| Low | 2 | navigate(-1) fragility, node re-render on selection |

### Acceptance Criteria

All 8 ACs verified ✅

### Verdict

**APPROVED** — React Flow full-page view with zoom, pan, minimap, controls. Medium finding fixed during review.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want a full-page DAG view with zoom, pan, minimap, and controls,
so that I can explore large workflows in detail.

## Acceptance Criteria

1. A "full view" button on the inline DAG opens a new route `/argo-workflows/:namespace/:name/dag`
2. The view includes zoom controls (zoom in, zoom out, fit-to-view buttons)
3. A minimap component shows the overall graph structure in the bottom-right corner
4. Mouse wheel zooms, click-drag pans the canvas
5. The `NodeDetailPanel` appears as a sidebar when a node is clicked
6. A back button returns to the entity page workflow list
7. The route is registered in `plugin.ts` with a `RouteRef`
8. Unit tests verify route registration, controls rendering, and navigation

## Tasks / Subtasks

- [x] Task 1: Add `@xyflow/react` dependency (AC: #2, #3, #4)
- [x] Task 2: Add sub-route ref for full-page DAG (AC: #7)
- [x] Task 3: Create `DAGFullPageView` component (AC: #1, #2, #3, #4, #5, #6)
- [x] Task 4: Add "Full View" button to inline DAG (AC: #1)
- [x] Task 5: Register route in plugin (AC: #7)
- [x] Task 6: Create tests (AC: #8)
- [x] Task 7: Verify build and tests (AC: all)

## Dev Notes

### React Flow v12 API

```typescript
import { ReactFlow, MiniMap, Controls, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

<ReactFlow
  nodes={rfNodes}
  edges={rfEdges}
  nodeTypes={{ dagNode: CustomNode }}
  edgeTypes={{ dagEdge: CustomEdge }}
  fitView
>
  <MiniMap />
  <Controls />
</ReactFlow>
```

### Dynamic import for code splitting

React Flow is ~150KB. Use dynamic import so it only loads when the full-page view is opened:

```typescript
// In plugin.ts
const DAGFullPageView = argoWorkflowsPlugin.provide(
  createRoutableExtension({
    name: 'DAGFullPageView',
    component: () => import('./components/DAGFullPage').then(m => m.DAGFullPageView),
    mountPoint: dagViewRouteRef,
  }),
);
```

### What NOT to Do

- Do NOT add React Flow to the inline DAG — Story 5.2 uses dagre-only rendering
- Do NOT add compressed node groups — that's Story 5.4/5.5
- Do NOT modify the backend

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required
- dagre + `computeDAGLayout` already available in `src/utils/`
- `structuredClone` polyfill already in setupTests.ts
- Mock React Flow in tests — jsdom can't render canvas/SVG measurement

### Project Structure Notes

```
plugins/argo-workflows/src/
├── routes.ts                          ← MODIFY (add dagViewRouteRef)
├── plugin.ts                          ← MODIFY (register route)
├── components/
│   ├── DAGFullPage/
│   │   ├── index.ts                   ← NEW
│   │   ├── DAGFullPageView.tsx        ← NEW
│   │   ├── DAGFullPageView.module.css ← NEW
│   │   └── DAGFullPageView.test.tsx   ← NEW
│   ├── DAGCardFlow/
│   │   └── DAGFlowView.tsx            ← MODIFY (add "Full View" button)
```

### References

- [Source: epics.md#Story 5.3] — Acceptance criteria
- [Source: @xyflow/react npm] — React Flow v12 API
- [Source: argo-workflows/src/utils/computeDAGLayout.ts] — dagre layout
- [Source: argo-workflows/src/routes.ts] — Current route setup

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `@xyflow/react` to frontend plugin for full-page DAG view only
- Created `DAGFullPageView` with React Flow, MiniMap, Controls, custom node/edge components
- Added `dagViewRouteRef` sub-route and registered in plugin
- Added "Full View ↗" link to inline `DAGFlowView` via `fullViewUrl` prop
- Custom node wraps existing `DAGNodeCard`, custom edge uses `getSmoothStepPath` with phase coloring
- Node selection opens `NodeDetailPanel` sidebar, Escape closes it
- 6 new tests (loading, error, back button, ReactFlow rendering, MiniMap/Controls, title)
- 198 total tests pass across 16 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/routes.ts
workspaces/argo-workflows/plugins/argo-workflows/src/plugin.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGFullPage/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGFullPage/DAGFullPageView.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGFullPage/DAGFullPageView.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGFullPage/DAGFullPageView.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGFlowView.tsx
