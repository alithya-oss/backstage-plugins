# Story 3.5: DAG Node Cards with Status Visualization

Status: done

<!-- Note: This story was fully implemented as part of Story 3.4 (Expandable Row with DAG Card Flow). -->

## Story

As a service owner,
I want each node in the DAG to show its name, status icon, and duration as a compact card,
so that I can identify node phases at a glance.

## Acceptance Criteria

1. Each card shows: status icon (from `PHASE_ICON_MAP`) + displayName + duration (monospace)
2. The card border is colored by phase using `PHASE_STATUS_MAP` → BUI border tokens (2px)
3. Succeeded nodes have green borders, Failed/Error have red, Running has blue, Pending has yellow
4. Skipped and Omitted nodes are dimmed (opacity 0.5) with neutral borders
5. displayName truncates with ellipsis at container width, full name shown on hover tooltip
6. Duration uses monospace font (`--bui-font-monospace`, 10px)
7. Cards are 150–180px wide, ~48px tall with 8px 12px padding
8. Hover state shifts background to `--bui-bg-neutral-3`
9. Unit tests verify rendering for all 7 phase states and truncation behavior

## Tasks / Subtasks

- [x] Task 1: All ACs implemented in Story 3.4's `DAGNodeCard` component
  - [x] Status icon from `PHASE_ICON_MAP` + displayName + duration (monospace)
  - [x] Phase-colored borders via `BORDER_CLASS` map + CSS
  - [x] Skipped/Omitted dimmed with `DIMMED_PHASES` set + `.dimmed` CSS class
  - [x] Ellipsis truncation + `title` attribute for hover tooltip
  - [x] Monospace duration at 10px
  - [x] Card dimensions: 150–180px × ~48px, 8px 12px padding
  - [x] Hover background shift to `--bui-bg-neutral-3`
  - [x] 18 tests covering all 7 phases, border classes, dimming, truncation, click, selection

## Dev Notes

This story's requirements were fully satisfied by the `DAGNodeCard` component created in Story 3.4. No additional implementation needed.

### Files (from Story 3.4)

- `plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.tsx`
- `plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.module.css`
- `plugins/argo-workflows/src/components/DAGCardFlow/DAGNodeCard.test.tsx`

### References

- [Source: epics.md#Story 3.5] — Acceptance criteria
- [Source: ux-design-specification.md#DAGNodeCard] — Component spec
- [Source: 3-4-expandable-row-with-dag-card-flow.md] — Implementation story

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Completion Notes List

- All 9 ACs already satisfied by `DAGNodeCard` from Story 3.4
- No additional code changes needed

### File List

(No new files — all implemented in Story 3.4)
