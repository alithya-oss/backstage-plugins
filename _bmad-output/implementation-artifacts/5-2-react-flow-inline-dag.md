# Story 5.2: dagre-Positioned Inline DAG

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
| Low | 2 | No arrow markers on edges, duplicated buildAriaLabel |

### Acceptance Criteria

All 7 ACs verified ✅

### Verdict

**APPROVED** — Clean dagre-only rendering. Lightweight, no extra dependencies. Correct absolute positioning with SVG edge layer.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want the expanded row DAG rendered with dagre-positioned nodes and SVG edges,
so that I see properly laid out nodes with routed edge paths instead of CSS flexbox arrows.

## Acceptance Criteria

1. Given a workflow row is expanded, when the DAG renders, then nodes are positioned using dagre layout coordinates as absolutely-positioned divs
2. Custom `DAGNodeCard` renders at dagre-computed x/y positions (preserving existing card design)
3. Edges render as SVG paths between nodes, colored by status (success=green, danger=red, inactive=gray)
4. The inline view auto-sizes to fit the dagre layout dimensions
5. The existing `DAGCardFlow` component is replaced by `DAGFlowView`
6. Node selection still opens the `NodeDetailPanel`
7. Unit tests verify node rendering, edge rendering, and node click interaction

## Tasks / Subtasks

- [x] Task 1: Create `DAGEdgeSVG` component for SVG edge rendering (AC: #3)
  - [x] Created with SVG paths, phase-colored strokes (success/danger/inactive)
  - [x] Points-to-path conversion using polyline

- [x] Task 2: Create `DAGFlowView` component (AC: #1, #2, #4, #5, #6)
  - [x] dagre-positioned nodes as absolutely-positioned divs
  - [x] SVG edge layer behind node layer
  - [x] Container auto-sizes to layout dimensions with overflow-x scroll
  - [x] aria-label with node count and phase summary

- [x] Task 3: Replace `DAGCardFlow` with `DAGFlowView` in `WorkflowExpandableRow` (AC: #5, #6)
  - [x] Updated import and JSX reference
  - [x] Updated barrel export in index.ts
  - [x] DAGCardFlow kept but deprecated

- [x] Task 4: Create tests (AC: #7)
  - [x] 8 DAGFlowView tests: nodes, edges, empty, selection, click, aria-label, boundary filter, diamond
  - [x] 5 DAGEdgeSVG tests: path count, success/danger/inactive classes, path d attribute
  - [x] Updated WorkflowExpandableRow mock to use DAGFlowView

- [x] Task 5: Verify build and tests (AC: all)
  - [x] 192 tests pass across 15 suites
  - [x] Build succeeds

## Dev Notes

### Architecture: dagre-only rendering (no React Flow)

```
NodeStatus[] → computeDAGLayout() → DAGLayout { nodes: PositionedNode[], edges: LayoutEdge[] }
  → DAGFlowView renders:
      ├── SVG layer (edges as <path> elements)
      └── DIV layer (DAGNodeCard at absolute positions)
```

React Flow is deferred to Story 5.3 (full-page view) where zoom/pan/minimap are needed. The inline view uses lightweight dagre + manual rendering.

### Rendering approach

```
┌─────────────────────────────────────────────┐
│ .flowContainer (position: relative)          │
│                                              │
│   <svg> (position: absolute, full size)      │
│     <path d="M..." stroke="green" />         │
│     <path d="M..." stroke="red" />           │
│   </svg>                                     │
│                                              │
│   <div style="position:absolute; left:0; top:15">  │
│     [DAGNodeCard: build]                     │
│   </div>                                     │
│   <div style="position:absolute; left:230; top:0">  │
│     [DAGNodeCard: test]                      │
│   </div>                                     │
│   <div style="position:absolute; left:230; top:90"> │
│     [DAGNodeCard: lint]                      │
│   </div>                                     │
│                                              │
└─────────────────────────────────────────────┘
```

### SVG edge path from dagre points

dagre provides routing points as `[{x,y}, {x,y}, ...]`. Convert to SVG path:

```typescript
function pointsToPath(points: Array<{x: number; y: number}>): string {
  if (points.length === 0) return '';
  const [start, ...rest] = points;
  let d = `M ${start.x} ${start.y}`;
  for (const p of rest) {
    d += ` L ${p.x} ${p.y}`;
  }
  return d;
}
```

For smoother curves, use quadratic bezier through midpoints — but polyline is fine for MVP.

### Container sizing

```typescript
const padding = 20;
const containerWidth = Math.max(...layout.nodes.map(n => n.x + n.width)) + padding;
const containerHeight = Math.max(...layout.nodes.map(n => n.y + n.height)) + padding;
```

### Edge color logic

Same as the existing `DAGArrow` status logic:
- Source node Succeeded → green (`--bui-fg-success`)
- Source node Failed/Error → red (`--bui-fg-danger`)
- Otherwise → gray (`--bui-fg-tertiary`)

### What NOT to Do

- Do NOT add `@xyflow/react` — that's Story 5.3 (full-page view only)
- Do NOT add zoom/pan/minimap — that's Story 5.3
- Do NOT add compressed node groups — that's Story 5.4/5.5
- Do NOT remove `DAGNodeCard` — it's reused at absolute positions
- Do NOT use canvas — SVG is sufficient for edge rendering

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- dagre is in the frontend plugin (ADR011 compliant)
- `structuredClone` polyfill already in setupTests.ts
- Pre-existing test failures in WorkflowTable.test.tsx — ignore
- `computeDAGLayout` returns top-left coordinates (already converted from dagre center)

### How This Connects to Other Stories

- **Story 5.1 (done):** `computeDAGLayout` provides dagre-positioned nodes and edges
- **Story 5.2 (this):** Manual rendering with positioned divs + SVG edges
- **Story 5.3 (next):** Full-page view adds React Flow for zoom/pan/minimap
- **Story 5.4/5.5 (future):** Compressed nodes and collapsible groups

### Project Structure Notes

```
plugins/argo-workflows/src/components/DAGCardFlow/
├── index.ts                  ← MODIFY (add DAGFlowView export)
├── DAGFlowView.tsx           ← NEW
├── DAGFlowView.module.css    ← NEW
├── DAGFlowView.test.tsx      ← NEW
├── DAGEdgeSVG.tsx            ← NEW
├── DAGEdgeSVG.module.css     ← NEW
├── DAGEdgeSVG.test.tsx       ← NEW
├── DAGCardFlow.tsx            ← KEEP (deprecated)
├── DAGNodeCard.tsx            ← KEEP (reused at absolute positions)
├── DAGNodeCard.module.css     ← KEEP
├── DAGArrow.tsx               ← KEEP (deprecated)
```

### References

- [Source: epics.md#Story 5.2] — Acceptance criteria
- [Source: argo-workflows/src/utils/computeDAGLayout.ts] — dagre layout function
- [Source: argo-workflows/src/components/DAGCardFlow/DAGNodeCard.tsx] — Existing card reused
- [Source: argo-workflows/src/components/DAGCardFlow/DAGCardFlow.tsx] — Being replaced

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `DAGFlowView` — dagre-positioned nodes as absolute divs + SVG edge layer
- Created `DAGEdgeSVG` — SVG paths colored by source node phase (success/danger/inactive)
- Replaced `DAGCardFlow` with `DAGFlowView` in `WorkflowExpandableRow`
- No new dependencies — uses dagre already installed in Story 5.1
- Container auto-sizes to dagre layout dimensions with overflow-x scroll
- 13 new tests (8 flow + 5 edge), 192 total tests pass across 15 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGFlowView.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGFlowView.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGFlowView.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGEdgeSVG.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGEdgeSVG.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGEdgeSVG.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.test.tsx
