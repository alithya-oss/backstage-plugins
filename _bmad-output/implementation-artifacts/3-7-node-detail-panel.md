# Story 3.7: Node Detail Panel

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
| Low | 4 | Unused React import, duplicated phase sets, missing edge case test, redundant gap:0 |

### Acceptance Criteria

All 11 ACs verified ✅

### Verdict

**APPROVED** — All acceptance criteria satisfied. Clean implementation with proper flex layout and Escape key handling.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want to click a node card in the DAG to see its detailed metadata in a side panel,
so that I can read error messages, timing data, and template information without leaving the DAG view.

## Acceptance Criteria

1. Given the DAG card flow is rendered with node cards, when the user clicks a `DAGNodeCard`, then the `NodeDetailPanel` appears to the right of the DAG (300px wide)
2. The DAG area shrinks to accommodate the panel (flex layout)
3. The panel header shows the status icon + node displayName + close button (×)
4. The panel body shows a metadata grid: Phase (Badge), Type, Template, Started, Finished, Duration
5. For Failed/Error nodes, an error message box appears below the metadata with monospace text on a danger-colored background
6. The panel's left border is colored by the node's phase (3px)
7. Clicking a different node updates the panel content in place (no slide animation)
8. Clicking the same node again or the close button (×) closes the panel — DAG takes full width
9. Pressing Escape closes the panel
10. The selected node card shows a blue selection ring (`box-shadow: 0 0 0 2px var(--bui-fg-info)`)
11. Unit tests verify panel open/close, content rendering for all phases, and error message display

## Tasks / Subtasks

- [x] Task 1: Create `NodeDetailPanel` component (AC: #1, #3, #4, #5, #6)
  - [x] Create file `plugins/argo-workflows/src/components/NodeDetailPanel/NodeDetailPanel.tsx`
  - [x] Add Alithya license header
  - [x] Create `NodeDetailPanel.module.css`
  - [x] Create `plugins/argo-workflows/src/components/NodeDetailPanel/index.ts` barrel export
  - [x] Props: `node: NodeStatus`, `onClose: () => void`
  - [x] Header: status icon (from `PHASE_ICON_MAP`) + displayName + close button (×)
  - [x] Close button: `aria-label="Close node detail panel"`
  - [x] Metadata grid with label-value pairs:
    - Phase: display as text with phase name
    - Type: `node.type`
    - Template: `node.templateName ?? '—'`
    - Started: `node.startedAt ?? '—'` (monospace)
    - Finished: `node.finishedAt ?? '—'` (monospace)
    - Duration: `formatDuration(node.duration)` (monospace)
  - [x] Error message box: only render if `node.message` exists AND phase is Failed/Error
    - Monospace text, danger-colored background (`--bui-bg-danger` or similar)
  - [x] Left border: 3px colored by phase using BUI border tokens
  - [x] Panel width: 300px, padding: 16px
  - [x] Add `@public` JSDoc tag

- [x] Task 2: Wire node selection state into `WorkflowExpandedContent` (AC: #1, #2, #7, #8, #9)
  - [x] Modify `WorkflowExpandableRow.tsx`:
    - Add `selectedNodeId` state (`useState<string | null>(null)`)
    - Add `handleNodeClick` callback: if same node, set null (close); if different, set new ID
    - Add `handleClosePanel` callback: set null
    - Add `useEffect` for Escape key listener when panel is open
    - Pass `selectedNodeId` and `onNodeClick` to `DAGCardFlow`
    - Render `NodeDetailPanel` next to `DAGCardFlow` in a flex container when a node is selected
    - Find the selected `NodeStatus` from `detail.nodes` by ID
  - [x] Update expanded content CSS: flex container for DAG + panel side-by-side
    - DAG area: `flex: 1; min-width: 0; overflow-x: auto`
    - Panel: `flex-shrink: 0; width: 300px`

- [x] Task 3: Create tests for `NodeDetailPanel` (AC: #3, #4, #5, #6, #11)
  - [x] Create `plugins/argo-workflows/src/components/NodeDetailPanel/NodeDetailPanel.test.tsx`
  - [x] Add Alithya license header
  - [x] Test: renders node displayName in header
  - [x] Test: renders status icon for the node's phase
  - [x] Test: renders close button with aria-label
  - [x] Test: calls onClose when close button clicked
  - [x] Test: renders metadata grid (Phase, Type, Template, Started, Finished, Duration)
  - [x] Test: renders error message box for Failed node with message
  - [x] Test: does not render error message box for Succeeded node
  - [x] Test: renders "—" for missing optional fields (templateName, finishedAt)
  - [x] Test: applies phase-colored left border class

- [x] Task 4: Create tests for node selection in `WorkflowExpandedContent` (AC: #1, #7, #8, #9, #11)
  - [x] Update `WorkflowExpandableRow.test.tsx`:
  - [x] Test: clicking a node card shows the NodeDetailPanel
  - [x] Test: clicking the same node again closes the panel
  - [x] Test: clicking close button closes the panel
  - [x] Test: pressing Escape closes the panel

- [x] Task 5: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows` — new tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md — `NodeDetailPanel` is a presentational component:

```typescript
interface NodeDetailPanelProps {
  node: NodeStatus;
  onClose: () => void;
}
```

**Layout when panel is open:**
```
┌─────────────────────────────────────────────────────────┐
│ Expanded Content (flex row)                              │
│ ┌──────────────────────────────┐ ┌────────────────────┐ │
│ │ DAGCardFlow (flex: 1)        │ │ NodeDetailPanel     │ │
│ │ overflow-x: auto             │ │ width: 300px        │ │
│ │                              │ │ flex-shrink: 0      │ │
│ └──────────────────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Existing Code to Reuse

**`DAGCardFlow`** already has `selectedNodeId` and `onNodeClick` props — just need to wire them.

**`DAGNodeCard`** already has `isSelected` prop with blue selection ring CSS (AC #10 already done).

**`PHASE_ICON_MAP`** and **`formatDuration`** from `argo-workflows-common`.

### Phase-to-Border Color Map

```typescript
const BORDER_CLASS: Record<string, string> = {
  Succeeded: styles.borderSuccess,
  Failed: styles.borderDanger,
  Error: styles.borderDanger,
  Running: styles.borderInfo,
  Pending: styles.borderWarning,
  Skipped: styles.borderNeutral,
  Omitted: styles.borderNeutral,
};
```

### Escape Key Handler

```typescript
useEffect(() => {
  if (!selectedNodeId) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setSelectedNodeId(null);
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [selectedNodeId]);
```

### What NOT to Do

- Do NOT add slide animation for panel — content updates in place per AC #7
- Do NOT add focus trap — that's Story 4.2
- Do NOT add aria-live — that's Story 4.3
- Do NOT add keyboard navigation for cards — that's Story 4.2
- Do NOT modify the backend or common package
- Do NOT add new npm dependencies

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- CSS modules use `@layer components { }` wrapper and BUI tokens
- Pre-existing failures in `WorkflowTable.test.tsx` — unrelated, ignore
- Mock pattern for hooks: `jest.mock('../../hooks')`
- `DAGCardFlow` already supports `selectedNodeId` and `onNodeClick` — no changes needed there

### How This Connects to Other Stories

- **Story 3.4 (done):** `DAGCardFlow` + `DAGNodeCard` with selection props ready
- **Story 3.7 (this):** Creates `NodeDetailPanel` + wires selection state
- **Story 4.2 (future):** Adds keyboard navigation for cards and panel focus management
- **Story 4.3 (future):** Adds aria-live and screen reader support

### Project Structure Notes

```
plugins/argo-workflows/src/components/
├── NodeDetailPanel/
│   ├── index.ts                    ← NEW
│   ├── NodeDetailPanel.tsx         ← NEW
│   ├── NodeDetailPanel.module.css  ← NEW
│   └── NodeDetailPanel.test.tsx    ← NEW
├── WorkflowTable/
│   ├── WorkflowExpandableRow.tsx   ← MODIFY (add selection state + panel)
│   ├── WorkflowExpandableRow.module.css ← MODIFY (add flex layout)
│   └── WorkflowExpandableRow.test.tsx   ← MODIFY (add panel tests)
```

### References

- [Source: epics.md#Story 3.7] — Acceptance criteria
- [Source: ux-design-specification.md#NodeDetailPanel] — Component spec, dimensions, states, content
- [Source: architecture.md#Structure Patterns] — NodeDetailPanel directory structure
- [Source: argo-workflows/src/components/DAGCardFlow/DAGCardFlow.tsx] — selectedNodeId/onNodeClick props
- [Source: argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx] — Integration point

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `NodeDetailPanel` component with header (icon + name + close), metadata grid, error message box
- Phase-colored 3px left border using BUI tokens
- Error box only shown for Failed/Error nodes with a message
- Wired selection state into `WorkflowExpandedContent`: `selectedNodeId` + `handleNodeClick` + Escape handler
- Flex layout: DAG area (flex: 1) + panel (300px) side-by-side
- 15 new tests for NodeDetailPanel, 4 new tests for panel interaction in WorkflowExpandableRow
- 144 total tests pass across 11 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/NodeDetailPanel/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/NodeDetailPanel/NodeDetailPanel.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/NodeDetailPanel/NodeDetailPanel.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/NodeDetailPanel/NodeDetailPanel.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.test.tsx
