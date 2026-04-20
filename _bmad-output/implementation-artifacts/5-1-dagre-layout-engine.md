# Story 5.1: dagre Layout Engine

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
| Low | 2 | No utils barrel export, structuredClone polyfill limitations |

### Acceptance Criteria

All 7 ACs verified ✅

### Verdict

**APPROVED** — ADR011 compliant. dagre in frontend plugin, types in common. Correct Backstage community pattern.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin developer,
I want the DAG layout computed by dagre instead of the custom Kahn's algorithm,
so that nodes have proper x/y positions and edges have routed paths for complex topologies.

## Acceptance Criteria

1. Given a `NodeStatus[]` array from a workflow detail response, when `computeDAGLayout(nodes)` is called, then it returns positioned nodes with `{ id, x, y, width, height }` and edges with `{ source, target, points }` using dagre layout
2. Boundary nodes (DAG, Steps, StepGroup) are filtered out — only execution nodes are positioned
3. The layout direction is left-to-right (rankdir: 'LR')
4. Node dimensions default to 180×60px with configurable spacing
5. The function uses `@dagrejs/graphlib` for the graph data structure and `dagre` for layout computation
6. The existing `computeDAGColumns` function is deprecated but kept for backward compatibility
7. Unit tests cover: linear, parallel, fan-out/fan-in, diamond, single node, empty input

## Tasks / Subtasks

- [x] Task 1: Add `@dagrejs/dagre` dependency (AC: #5)
  - [x] Run `yarn add @dagrejs/dagre` in `plugins/argo-workflows-common`
  - [x] Note: `@dagrejs/dagre` bundles `@dagrejs/graphlib` — no separate install needed
  - [x] Verify `yarn backstage-cli package build` succeeds

- [x] Task 2: Create `DAGLayout` types in `types.ts` (AC: #1)
  - [x] Add `PositionedNode` interface: `{ id: string; x: number; y: number; width: number; height: number; data: NodeStatus }`
  - [x] Add `LayoutEdge` interface: `{ source: string; target: string; points: Array<{ x: number; y: number }> }`
  - [x] Add `DAGLayout` interface: `{ nodes: PositionedNode[]; edges: LayoutEdge[] }`
  - [x] Add `@public` JSDoc tags
  - [x] Export from `index.ts`

- [x] Task 3: Create `computeDAGLayout.ts` (AC: #1, #2, #3, #4, #5)
  - [x] Create file `plugins/argo-workflows-common/src/computeDAGLayout.ts`
  - [x] Add Alithya license header
  - [x] Import `dagre` from `@dagrejs/dagre`
  - [x] Import `NodeStatus`, `DAGLayout`, `PositionedNode`, `LayoutEdge` from `./types`
  - [x] Define constants: `DEFAULT_NODE_WIDTH = 180`, `DEFAULT_NODE_HEIGHT = 60`, `RANK_SEP = 50`, `NODE_SEP = 30`
  - [x] Define `BOUNDARY_TYPES` set (same as `computeDAGColumns`)
  - [x] Implement `computeDAGLayout(nodes: NodeStatus[], options?: { nodeWidth?: number; nodeHeight?: number }): DAGLayout`
  - [x] Add `@public` JSDoc tag

- [x] Task 4: Deprecate `computeDAGColumns` (AC: #6)
  - [x] Add `@deprecated Use computeDAGLayout instead` JSDoc tag to `computeDAGColumns`
  - [x] Keep the function and its export — do NOT remove

- [x] Task 5: Export `computeDAGLayout` from `index.ts` (AC: #1)
  - [x] Add type exports: `PositionedNode`, `LayoutEdge`, `DAGLayout`
  - [x] Add function export: `computeDAGLayout`

- [x] Task 6: Create `computeDAGLayout.test.ts` (AC: #7)
  - [x] 13 tests covering: empty, undefined, single node, linear, fan-out, fan-in, diamond, boundary filtering, dimensions, custom options, edge points, data preservation

- [x] Task 7: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — 53 tests pass across 4 suites
  - [x] Run `yarn backstage-cli package build` — succeeds

## Dev Notes

### dagre API Reference

```typescript
import dagre from '@dagrejs/dagre';

// Create graph
const g = new dagre.graphlib.Graph();
g.setGraph({ rankdir: 'LR', ranksep: 50, nodesep: 30 });
g.setDefaultEdgeLabel(() => ({}));

// Add nodes (must specify width/height)
g.setNode('a', { width: 180, height: 60, label: 'build' });

// Add edges
g.setEdge('a', 'b');

// Run layout
dagre.layout(g);

// Read positions (dagre sets x, y on each node — center coordinates)
const node = g.node('a'); // { x, y, width, height, label }

// Read edge points (dagre computes routing points)
const edge = g.edge({ v: 'a', w: 'b' }); // { points: [{x, y}, ...] }
```

**Important:** dagre positions are center coordinates, not top-left. React Flow expects top-left. The conversion is: `topLeftX = x - width/2`, `topLeftY = y - height/2`. Do this conversion in `computeDAGLayout` so consumers get top-left coordinates.

### Relationship to `computeDAGColumns`

`computeDAGColumns` returns `DAGColumn[]` — a column-based grouping without x/y positions. `computeDAGLayout` returns `DAGLayout` with precise x/y positions and edge routing. The old function is kept for backward compatibility but deprecated.

### What NOT to Do

- Do NOT remove `computeDAGColumns` — deprecate only, keep for backward compat
- Do NOT modify the frontend plugin in this story — that's Story 5.2
- Do NOT add React Flow — that's Story 5.2
- Do NOT handle compressed nodes — that's Story 5.4
- Do NOT modify the backend

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `BOUNDARY_TYPES` set pattern already used in `computeDAGColumns.ts`

### How This Connects to Other Stories

- **Story 3.2 (done):** `computeDAGColumns` — being deprecated, replaced by this
- **Story 5.1 (this):** dagre layout engine in common package
- **Story 5.2 (next):** React Flow inline DAG consumes `computeDAGLayout` output
- **Story 5.3 (future):** Full-page DAG view also uses `computeDAGLayout`

### Project Structure Notes

```
plugins/argo-workflows-common/src/
├── types.ts                  ← MODIFY (add PositionedNode, LayoutEdge, DAGLayout)
├── index.ts                  ← MODIFY (add exports)
├── computeDAGLayout.ts       ← NEW
├── computeDAGLayout.test.ts  ← NEW
├── computeDAGColumns.ts      ← MODIFY (add @deprecated tag)
└── ... (existing files unchanged)
```

### References

- [Source: sprint-change-proposal-2026-04-19.md] — Phase 2 change proposal
- [Source: epics.md#Story 5.1] — Acceptance criteria
- [Source: dagre wiki] — dagre API: Graph, setNode, setEdge, layout
- [Source: argo-workflows-common/src/computeDAGColumns.ts] — Current layout being replaced

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `@dagrejs/dagre` (+ `@types/dagre`) to **frontend plugin** (not common — per ADR011, dagre is a rendering concern)
- Types (`PositionedNode`, `LayoutEdge`, `DAGLayout`) remain in common package (lightweight, no dependencies)
- Created `computeDAGLayout` in `plugins/argo-workflows/src/utils/` — uses dagre for LR graph layout
- Deprecated `computeDAGColumns` with `@deprecated` JSDoc tag (kept for backward compat)
- Added `structuredClone` polyfill to frontend plugin test setup (dagre uses it)
- Corrected package placement after review: follows Tekton plugin pattern and ADR011
- 13 new tests in frontend plugin, 40 tests pass in common package
- Both packages build successfully

### File List

workspaces/argo-workflows/plugins/argo-workflows-common/package.json
workspaces/argo-workflows/plugins/argo-workflows-common/src/types.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/computeDAGLayout.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/computeDAGLayout.test.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/computeDAGColumns.ts
