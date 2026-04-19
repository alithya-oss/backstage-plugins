# Story 3.6: Node Status Dots in Table Row

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 1 | White text on yellow warning background may have contrast issues — deferred to Epic 4 |
| Low | 4 | Unused React import, aria-label order, index keys, missing boundary test |

### Acceptance Criteria

All 7 ACs verified ✅

### Verdict

**APPROVED** — Clean, focused implementation. All acceptance criteria satisfied.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want a compact visual summary of node phases in each table row,
so that I can assess node-level health without expanding the row.

## Acceptance Criteria

1. Given the workflow list table displays `WorkflowSummary` data, when the `NodeStatusDots` component renders in the "Node Status" column, then it displays a row of colored squares (14×14px, 3px border-radius) — one per node
2. Each square is colored by the node's phase and contains the phase icon character
3. When there are more than 12 nodes, the first 10 are shown with "+N more" text
4. Hovering a dot shows a tooltip with the node's displayName and phase
5. An empty workflow (no nodes) shows a single gray dash
6. The container has an `aria-label` summarizing node counts by phase
7. Unit tests verify rendering for various node counts, overflow, and empty state

## Tasks / Subtasks

- [x] Task 1: Create `NodeStatusDots` component (AC: #1, #2, #3, #4, #5, #6)
  - [x] Create file `plugins/argo-workflows/src/components/WorkflowTable/NodeStatusDots.tsx`
  - [x] Add Alithya license header
  - [x] Create `NodeStatusDots.module.css`
  - [x] Props: `nodes: NodeStatusSummary[]`
  - [x] Import `PHASE_STATUS_MAP`, `PHASE_ICON_MAP` from `@backstage-community/plugin-argo-workflows-common`
  - [x] Render a flex row of colored squares (14×14px, 3px border-radius, 3px gap)
  - [x] Each square: background colored by phase using a phase-to-BUI-color map, contains phase icon character (white text, 8px font)
  - [x] Phase-to-background mapping: Succeeded=`--bui-fg-success`, Failed=`--bui-fg-danger`, Error=`--bui-fg-danger`, Running=`--bui-fg-info`, Pending=`--bui-fg-warning`, Skipped/Omitted=`--bui-fg-tertiary`
  - [x] Overflow: if `nodes.length > 12`, show first 10 dots + "+{remaining} more" text in secondary color
  - [x] Empty: if `nodes.length === 0`, show a single gray dash "—"
  - [x] Each dot: `title="{displayName}: {phase}"` for hover tooltip
  - [x] Container: `aria-label="Node status: {N} succeeded, {N} failed, ..."` summarizing counts by phase
  - [x] Add `@public` JSDoc tag

- [x] Task 2: Add "Node Status" column to `WorkflowTable` (AC: #1)
  - [x] Import `NodeStatusDots` in `WorkflowTable.tsx`
  - [x] Add a new column after "Status" in the `columns` array:
    ```
    { id: 'nodeStatus', label: 'Node Status', cell: item => <Cell><NodeStatusDots nodes={item.nodes} /></Cell> }
    ```
  - [x] Export `NodeStatusDots` from `WorkflowTable/index.ts`

- [x] Task 3: Create `NodeStatusDots.test.tsx` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create file `plugins/argo-workflows/src/components/WorkflowTable/NodeStatusDots.test.tsx`
  - [x] Add Alithya license header
  - [x] Test: renders one dot per node
  - [x] Test: each dot has correct phase icon character
  - [x] Test: each dot has title attribute with displayName and phase
  - [x] Test: overflow — 15 nodes shows 10 dots + "+5 more"
  - [x] Test: empty nodes shows gray dash
  - [x] Test: container has aria-label with phase counts
  - [x] Test: single node renders one dot, no overflow text

- [x] Task 4: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows` — new tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md and UX spec — `NodeStatusDots` is a presentational component in the WorkflowTable:

```typescript
interface NodeStatusDotsProps {
  nodes: NodeStatusSummary[];
}
```

**`NodeStatusSummary`** (from `argo-workflows-common/types.ts`):
```typescript
interface NodeStatusSummary {
  displayName: string;
  phase: NodePhase;
}
```

This is the lightweight node data already included in `WorkflowSummary.nodes` — no additional API call needed.

### Phase-to-Background Color Map

Create a local map for dot background colors (different from `PHASE_STATUS_MAP` which maps to BUI status strings):

```typescript
const DOT_BG: Record<string, string> = {
  Succeeded: 'var(--bui-fg-success)',
  Failed: 'var(--bui-fg-danger)',
  Error: 'var(--bui-fg-danger)',
  Running: 'var(--bui-fg-info)',
  Pending: 'var(--bui-fg-warning)',
  Skipped: 'var(--bui-fg-tertiary)',
  Omitted: 'var(--bui-fg-tertiary)',
};
```

Use inline `style={{ background: DOT_BG[phase] }}` on each dot since the color is dynamic per-node.

### Aria-Label Generation

Build the summary string by counting phases:
```typescript
function buildAriaLabel(nodes: NodeStatusSummary[]): string {
  const counts: Record<string, number> = {};
  for (const n of nodes) {
    counts[n.phase] = (counts[n.phase] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(([phase, count]) => `${count} ${phase.toLowerCase()}`);
  return `Node status: ${parts.join(', ')}`;
}
```

### Overflow Logic

```
MAX_VISIBLE = 10
OVERFLOW_THRESHOLD = 12

if (nodes.length > OVERFLOW_THRESHOLD) {
  show first MAX_VISIBLE dots + "+{nodes.length - MAX_VISIBLE} more"
} else {
  show all dots
}
```

### What NOT to Do

- Do NOT make dots clickable — they are informational only
- Do NOT use `PHASE_STATUS_MAP` for background colors — that maps to BUI status strings, not CSS color variables
- Do NOT fetch additional data — `WorkflowSummary.nodes` already has `NodeStatusSummary[]`
- Do NOT add keyboard navigation to individual dots — that's Epic 4
- Do NOT modify the backend or common package
- Do NOT add new npm dependencies

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- CSS modules use `@layer components { }` wrapper and BUI tokens
- Pre-existing failures in `WorkflowTable.test.tsx` (5 tests) — unrelated, ignore
- Pre-existing `plugin.test.ts` failure — unrelated, ignore

### How This Connects to Other Stories

- **Story 2.5 (done):** `WorkflowTable` renders the table with columns — we add a new column
- **Story 3.4 (done):** Expand button column already added — Node Status column goes after Status
- **Story 3.6 (this):** Adds `NodeStatusDots` component + column to table
- **Story 4.3 (future):** Adds screen reader support with enhanced aria attributes

### Project Structure Notes

```
plugins/argo-workflows/src/components/WorkflowTable/
├── NodeStatusDots.tsx          ← NEW
├── NodeStatusDots.module.css   ← NEW
├── NodeStatusDots.test.tsx     ← NEW
├── WorkflowTable.tsx           ← MODIFY (add column + import)
├── index.ts                    ← MODIFY (add export)
└── ... (existing files unchanged)
```

### References

- [Source: epics.md#Story 3.6] — Acceptance criteria
- [Source: ux-design-specification.md#NodeStatusDots] — Component spec, phase-to-color mapping, overflow, accessibility
- [Source: argo-workflows-common/src/types.ts] — `NodeStatusSummary` interface
- [Source: argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx] — Table to modify

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `NodeStatusDots` component with colored 14×14px squares, phase icons, overflow at >12 nodes
- Phase-to-background color map using BUI CSS variables (inline styles for dynamic per-node coloring)
- Overflow: shows first 10 dots + "+N more" when >12 nodes
- Empty state: gray dash with aria-label "Node status: none"
- Aria-label summarizes phase counts for screen readers
- Added "Node Status" column to WorkflowTable after Status column
- 10 new tests, 127 total tests pass across 10 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/NodeStatusDots.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/NodeStatusDots.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/NodeStatusDots.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/index.ts
