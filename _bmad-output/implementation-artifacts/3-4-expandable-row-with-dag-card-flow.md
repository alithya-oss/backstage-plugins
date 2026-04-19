# Story 3.4: Expandable Row with DAG Card Flow

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 1 | Keyboard activation on DAGNodeCard — deferred to Story 4.2 per story scope |
| Medium | 2 | Unused React imports; aria-controls missing on expand button |
| Low | 7 | Various minor improvements |

### Acceptance Criteria

All 11 ACs verified ✅

### Verdict

**APPROVED** — All acceptance criteria satisfied. Keyboard navigation deferred to Story 4.2 as designed.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a service owner,
I want to click an expand button on a workflow row to reveal the DAG execution diagram inline,
so that I can see the workflow topology without leaving the list view.

## Acceptance Criteria

1. Given the workflow list table is displayed, when the user clicks the expand button (▶) on a workflow row, then the row expands to reveal the `DAGCardFlow` component below the table row
2. The expand button rotates 90° and changes to info color
3. The row background highlights with `--bui-bg-neutral-2`
4. The `DAGCardFlow` renders a horizontal left-to-right flow of `DAGNodeCard` components grouped into columns
5. Parallel nodes in the same column are stacked vertically with a "parallel" label above
6. `DAGArrow` components connect columns with status-colored arrows (success=green, danger=red, inactive=gray dashed)
7. Only one row can be expanded at a time — expanding a new row collapses the previous
8. The expanded row shows a loading skeleton while `useWorkflowDetail` fetches data
9. Horizontal scroll activates when the DAG overflows the container width
10. The expanded state persists during polling updates (row doesn't collapse on refresh)
11. Unit tests verify expand/collapse behavior, single-row constraint, and loading state

## Tasks / Subtasks

- [x] Task 1: Create `WorkflowExpandableRow` component (AC: #1, #2, #3, #7, #8, #10)
  - [x] Create file `plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx`
  - [x] Add Alithya license header
  - [x] Create `WorkflowExpandableRow.module.css` with styles for expand button, expanded row, loading skeleton
  - [x] Props: `workflow: WorkflowSummary`, `isExpanded: boolean`, `onToggle: () => void`
  - [x] Render expand button (▶) that rotates 90° when expanded (CSS transform)
  - [x] When expanded, call `useWorkflowDetail(workflow.namespace, workflow.name)` to fetch detail
  - [x] Show loading skeleton while `loading` is true
  - [x] When loaded, render `DAGCardFlow` with `workflow.nodes`
  - [x] Row background: `--bui-bg-neutral-2` when expanded
  - [x] Expand button color: `--bui-fg-info` when expanded
  - [x] Add `@public` JSDoc tag

- [x] Task 2: Create `DAGNodeCard` component (AC: #4)
  - [x] Create file `plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.tsx`
  - [x] Create `DAGNodeCard.module.css`
  - [x] Props: `node: NodeStatus`, `isSelected?: boolean`, `onClick?: () => void`
  - [x] Render status icon (from `PHASE_ICON_MAP`) + displayName + duration (monospace)
  - [x] Border colored by phase using `PHASE_STATUS_MAP` → BUI border tokens (2px)
  - [x] Succeeded=green, Failed/Error=red, Running=blue, Pending=yellow
  - [x] Skipped/Omitted: dimmed (opacity 0.5) with neutral border
  - [x] displayName truncates with ellipsis, full name on hover via `title` attribute
  - [x] Duration in monospace font, 10px
  - [x] Card dimensions: 150–180px wide, ~48px tall, 8px 12px padding
  - [x] Hover: background shifts to `--bui-bg-neutral-3`
  - [x] Selected: blue ring `box-shadow: 0 0 0 2px var(--bui-fg-info)`
  - [x] Add `@public` JSDoc tag

- [x] Task 3: Create `DAGArrow` component (AC: #6)
  - [x] Create file `plugins/argo-workflows/src/components/DAGCardFlow/DAGArrow.tsx`
  - [x] Create `DAGArrow.module.css`
  - [x] Props: `status: 'success' | 'danger' | 'inactive'`
  - [x] Render arrow indicator (→) between columns
  - [x] Color by status: success=`--bui-fg-success`, danger=`--bui-fg-danger`, inactive=`--bui-fg-tertiary` with dashed style
  - [x] Vertically centered between columns
  - [x] Add `@public` JSDoc tag

- [x] Task 4: Create `DAGCardFlow` component (AC: #4, #5, #6, #9)
  - [x] Create file `plugins/argo-workflows/src/components/DAGCardFlow/DAGCardFlow.tsx`
  - [x] Create `DAGCardFlow.module.css`
  - [x] Create `plugins/argo-workflows/src/components/DAGCardFlow/index.ts` barrel export
  - [x] Props: `nodes: NodeStatus[]`, `selectedNodeId?: string`, `onNodeClick?: (nodeId: string) => void`
  - [x] Call `computeDAGColumns(nodes)` to get `DAGColumn[]`
  - [x] Render horizontal flex container with columns and `DAGArrow` between them
  - [x] Each column: if `isParallel`, show "parallel" label above, stack `DAGNodeCard` vertically
  - [x] Determine arrow status from the phase of the preceding column's nodes
  - [x] Horizontal scroll via `overflow-x: auto` on container
  - [x] Handle empty nodes: show message "This workflow has no execution nodes."
  - [x] Add `@public` JSDoc tag

- [x] Task 5: Integrate expandable row into `WorkflowTable` (AC: #1, #7, #10)
  - [x] Modify `WorkflowTable.tsx` to add expand button column as first column
  - [x] Add `expandedWorkflowId` state (`useState<string | null>(null)`)
  - [x] Toggle expand on click — if same ID, collapse; if different, expand new
  - [x] Render expanded content row below the expanded workflow row
  - [x] Pass `useWorkflowDetail` data to `DAGCardFlow`
  - [x] Ensure expanded state persists during polling (keyed by workflow ID, not array index)

- [x] Task 6: Create tests for `WorkflowExpandableRow` (AC: #1, #2, #3, #7, #8, #11)
  - [x] Create `WorkflowExpandableRow.test.tsx`
  - [x] Test: renders expand button in collapsed state
  - [x] Test: calls onToggle when expand button clicked
  - [x] Test: shows loading skeleton when expanded and loading
  - [x] Test: renders DAGCardFlow when expanded and loaded

- [x] Task 7: Create tests for `DAGCardFlow` (AC: #4, #5, #6, #9, #11)
  - [x] Create `DAGCardFlow.test.tsx`
  - [x] Test: renders node cards for each execution node
  - [x] Test: renders columns in topological order
  - [x] Test: renders "parallel" label for columns with multiple nodes
  - [x] Test: renders arrows between columns
  - [x] Test: handles empty nodes array
  - [x] Test: calls onNodeClick when a card is clicked

- [x] Task 8: Create tests for `DAGNodeCard` (AC: #4, #11)
  - [x] Create `DAGNodeCard.test.tsx`
  - [x] Test: renders displayName and duration
  - [x] Test: renders status icon for each phase
  - [x] Test: applies phase-colored border class
  - [x] Test: applies dimmed style for Skipped/Omitted
  - [x] Test: calls onClick when clicked
  - [x] Test: truncates long displayName with title attribute

- [x] Task 9: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows` — new tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md — Story 3.4 creates the expandable row + DAG card flow components:

**Component hierarchy:**
```
WorkflowTable
  └── WorkflowExpandableRow (per workflow row)
        └── DAGCardFlow (when expanded + loaded)
              ├── DAGNodeCard (per execution node)
              └── DAGArrow (between columns)
```

**Data flow:**
```
WorkflowTable (workflows: WorkflowSummary[])
  → expand row → useWorkflowDetail(namespace, name)
  → WorkflowDetail.nodes → computeDAGColumns(nodes) → DAGColumn[]
  → DAGCardFlow renders columns with DAGNodeCard + DAGArrow
```

### Existing Code to Reuse

**`computeDAGColumns`** (from `argo-workflows-common`, Story 3.2):
```typescript
import { computeDAGColumns } from '@backstage-community/plugin-argo-workflows-common';
// Returns DAGColumn[] with nodes grouped by topological level
```

**`useWorkflowDetail`** (from `src/hooks`, Story 3.3):
```typescript
import { useWorkflowDetail } from '../../hooks';
// Returns { workflow: WorkflowDetail | null, loading: boolean, error: Error | null }
```

**`PHASE_STATUS_MAP` and `PHASE_ICON_MAP`** (from `argo-workflows-common`):
```typescript
import { PHASE_STATUS_MAP, PHASE_ICON_MAP } from '@backstage-community/plugin-argo-workflows-common';
// Maps NodePhase → BUI status string and icon character
```

**`formatDuration`** (from `argo-workflows-common`):
```typescript
import { formatDuration } from '@backstage-community/plugin-argo-workflows-common';
```

**BUI components** (from `@backstage/ui`):
- `Table`, `useTable`, `Cell`, `CellText` — already used in `WorkflowTable.tsx`
- `Flex`, `Text`, `Badge` — for layout and typography
- `Skeleton` — for loading state (if available, otherwise use CSS placeholder)

### CSS Module Patterns

Follow the existing pattern from `WorkflowStatusIndicator.module.css`:
- Use `@layer components { }` wrapper
- Use BUI CSS custom properties: `--bui-bg-*`, `--bui-fg-*`, `--bui-border-*`, `--bui-space-*`, `--bui-font-*`
- Zero hardcoded color values — all colors from BUI tokens
- Co-locate `.module.css` with the component file

### Arrow Status Logic

Determine arrow color from the preceding column's nodes:
- If ALL nodes in the preceding column are `Succeeded` → arrow is `success` (green)
- If ANY node in the preceding column is `Failed` or `Error` → arrow is `danger` (red)
- Otherwise (Pending, Running, Skipped, Omitted) → arrow is `inactive` (gray dashed)

### Expand/Collapse State Management

The expand state lives in `WorkflowTable` as `expandedWorkflowId: string | null`:
- `null` = no row expanded
- `"namespace/name"` = that row is expanded
- Clicking expand on a different row sets the new ID (auto-collapses previous)
- Clicking expand on the already-expanded row sets `null` (collapses)
- The ID is stable across polling updates (uses `namespace/name`, not array index)

### Loading Skeleton

When a row is expanded but `useWorkflowDetail` is still loading:
- Show a horizontal row of 3-4 skeleton rectangles (150px × 48px) with arrows between them
- Use CSS animation or BUI Skeleton component if available
- This gives the user immediate visual feedback that the DAG is loading

### What NOT to Do

- Do NOT use React Flow or elkjs — this is pure CSS flexbox layout
- Do NOT create a separate page for the DAG — it renders inline in the expanded row
- Do NOT add node click → panel interaction yet — that's Story 3.7
- Do NOT add NodeStatusDots to the table — that's Story 3.6
- Do NOT add keyboard navigation — that's Story 4.1/4.2
- Do NOT add aria attributes beyond basic expand/collapse — that's Story 4.1/4.3
- Do NOT add error boundaries — that's Story 4.5
- Do NOT modify the backend or common package
- Do NOT add new npm dependencies
- Do NOT use MUI components — BUI only

### Previous Story Learnings (from Stories 3.1, 3.2, 3.3)

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- Pre-existing `plugin.test.ts` failure in backend (TodoListService import) — unrelated, ignore
- Pre-existing failures in `WorkflowTable.test.tsx` (5 tests) — unrelated BUI component issues, ignore
- CSS modules use `@layer components { }` wrapper and BUI tokens
- Import across packages: `@backstage-community/plugin-argo-workflows-common`
- Mock pattern for hooks: `jest.mock('../../hooks')` or `jest.mock('@backstage/core-plugin-api')`
- `useWorkflowDetail` returns `{ workflow, loading, error }` — `workflow` is null until loaded

### How This Connects to Other Stories

- **Story 3.2 (done):** `computeDAGColumns` provides the layout algorithm
- **Story 3.3 (done):** `useWorkflowDetail` provides the data fetching hook
- **Story 3.4 (this):** Creates the visual components: expandable row, DAG card flow, node cards, arrows
- **Story 3.5 (next):** Enhances `DAGNodeCard` with detailed status visualization (may already be partially covered here)
- **Story 3.6 (future):** Adds `NodeStatusDots` to the table row
- **Story 3.7 (future):** Adds `NodeDetailPanel` side panel on node click

### Project Structure Notes

New files in the frontend plugin:
```
plugins/argo-workflows/src/components/
├── WorkflowTable/
│   ├── WorkflowExpandableRow.tsx        ← NEW
│   ├── WorkflowExpandableRow.module.css ← NEW
│   ├── WorkflowExpandableRow.test.tsx   ← NEW
│   ├── WorkflowTable.tsx                ← MODIFY (add expand column + state)
│   └── ... (existing files unchanged)
├── DAGCardFlow/
│   ├── index.ts                         ← NEW
│   ├── DAGCardFlow.tsx                  ← NEW
│   ├── DAGCardFlow.module.css           ← NEW
│   ├── DAGCardFlow.test.tsx             ← NEW
│   ├── DAGNodeCard.tsx                  ← NEW
│   ├── DAGNodeCard.module.css           ← NEW
│   ├── DAGNodeCard.test.tsx             ← NEW
│   ├── DAGArrow.tsx                     ← NEW
│   └── DAGArrow.module.css              ← NEW
```

### References

- [Source: architecture.md#Frontend Architecture] — Component hierarchy, hook architecture
- [Source: architecture.md#DAG Layout Algorithm] — `computeDAGColumns` usage
- [Source: architecture.md#Structure Patterns] — Component file organization, co-located tests
- [Source: architecture.md#Naming Patterns] — PascalCase components, CSS modules
- [Source: epics.md#Story 3.4] — Acceptance criteria
- [Source: ux-design-specification.md#WorkflowExpandableRow] — Expand/collapse states, interaction
- [Source: ux-design-specification.md#DAGCardFlow] — Layout rules, states, interaction
- [Source: ux-design-specification.md#DAGNodeCard] — Dimensions, states, phase styling
- [Source: argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx] — Existing table to modify
- [Source: argo-workflows/src/hooks/useWorkflowDetail.ts] — Detail hook to use
- [Source: argo-workflows-common/src/computeDAGColumns.ts] — Layout algorithm to use

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `WorkflowExpandableRow` with `ExpandButton` and `WorkflowExpandedContent` components
- Created `DAGNodeCard` with phase-colored borders, status icons, dimmed Skipped/Omitted, truncation
- Created `DAGArrow` with success/danger/inactive status coloring
- Created `DAGCardFlow` using `computeDAGColumns` for horizontal flexbox card flow with parallel labels
- Integrated expand button column into `WorkflowTable` with single-row expand constraint
- Expanded state keyed by `namespace/name` for polling persistence
- 5 CSS modules using BUI tokens, `@layer components` pattern
- 35 new tests across 3 test files, 117 total tests pass across 9 suites
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowExpandableRow.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGCardFlow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGCardFlow.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGCardFlow.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGArrow.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/DAGCardFlow/DAGArrow.module.css
