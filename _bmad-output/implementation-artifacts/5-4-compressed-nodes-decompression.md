# Story 5.4: Compressed Nodes Decompression

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
| Low | 1 | Double filter iteration for childNodeIds + phase aggregation |

### Acceptance Criteria

All 6 ACs verified ✅

### Verdict

**APPROVED** — Clean decompression logic. Correct boundaryID hierarchy resolution.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin developer,
I want nested DAG/Steps/StepGroup templates resolved into a hierarchical structure,
so that the DAG can display template groups as collapsible containers.

## Acceptance Criteria

1. Given a `NodeStatus[]` array containing boundary nodes with `boundaryID` references, when `decompressNodes(nodes)` is called, then it returns `{ groups: DAGGroup[], executionNodes: NodeStatus[] }` with parent-child hierarchy
2. Each `DAGGroup` has `id`, `displayName`, `type`, `parentId`, `childNodeIds`, and `phase`
3. Execution nodes are associated with their containing group via `boundaryID`
4. Orphan execution nodes (no `boundaryID`) are placed in a root-level implicit group
5. The function handles deeply nested templates (DAG → Steps → StepGroup → Pod)
6. Unit tests cover: flat workflow, single-level nesting, multi-level nesting, orphan nodes

## Tasks / Subtasks

- [x] Task 1: Add `DAGGroup` type to common package (AC: #2)
  - [x] Added `DAGGroup` and `DecompressedNodes` interfaces with `@public` JSDoc tags
  - [x] Exported from `index.ts`

- [x] Task 2: Create `decompressNodes` function (AC: #1, #3, #4, #5)
  - [x] Separates boundary nodes from execution nodes
  - [x] Builds `DAGGroup` for each boundary node with childNodeIds from boundaryID matching
  - [x] Resolves parentId for nested boundary nodes
  - [x] Aggregates phase from child execution nodes
  - [x] Handles orphan nodes (no boundaryID)

- [x] Task 3: Create tests (AC: #6)
  - [x] 11 tests: empty, undefined, flat, single-level, multi-level, orphans, phase aggregation (4 cases), mixed

- [x] Task 4: Verify build and tests (AC: all)
  - [x] 51 tests pass across 4 suites, build succeeds

## Dev Notes

### `boundaryID` in Argo Workflows

In Argo Workflow CRDs, `status.nodes[*].boundaryID` references the parent template node. For example:
- A `DAG` node has no `boundaryID` (it's the root)
- A `Pod` node inside a DAG has `boundaryID` pointing to the DAG node's ID
- A `StepGroup` inside `Steps` has `boundaryID` pointing to the Steps node's ID
- A `Pod` inside a `StepGroup` has `boundaryID` pointing to the StepGroup node's ID

This creates a tree: `DAG → Steps → StepGroup → Pod`.

### Phase Aggregation Logic

```typescript
function aggregatePhase(childNodes: NodeStatus[]): NodePhase {
  if (childNodes.some(n => n.phase === 'Failed' || n.phase === 'Error')) return 'Failed';
  if (childNodes.some(n => n.phase === 'Running')) return 'Running';
  if (childNodes.every(n => n.phase === 'Succeeded')) return 'Succeeded';
  if (childNodes.some(n => n.phase === 'Pending')) return 'Pending';
  return 'Pending';
}
```

### Package Placement

`decompressNodes` is a pure function with no dependencies beyond types — belongs in `argo-workflows-common` per ADR011 (isomorphic utility).

### What NOT to Do

- Do NOT modify the frontend plugin — that's Story 5.5
- Do NOT modify the backend — `boundaryID` is already mapped
- Do NOT add dagre or React Flow — this is pure TypeScript logic

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required
- `BOUNDARY_TYPES` set pattern used in `computeDAGColumns` and `computeDAGLayout`

### Project Structure Notes

```
plugins/argo-workflows-common/src/
├── types.ts                  ← MODIFY (add DAGGroup, DecompressedNodes)
├── index.ts                  ← MODIFY (add exports)
├── decompressNodes.ts        ← NEW
├── decompressNodes.test.ts   ← NEW
```

### References

- [Source: epics.md#Story 5.4] — Acceptance criteria
- [Source: sprint-change-proposal-2026-04-19.md] — Phase 2 compressed nodes design
- [Source: argo-workflows-common/src/types.ts] — NodeStatus.boundaryID field
- [Source: argo-workflows-backend/src/mappers/workflowMapper.ts] — boundaryID mapping

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `DAGGroup` and `DecompressedNodes` types to common package
- Created `decompressNodes` — separates boundary/execution nodes, builds group hierarchy via boundaryID
- Phase aggregation: Failed > Running > Succeeded > Pending
- Handles multi-level nesting (DAG → Steps → StepGroup → Pod) and orphan nodes
- 11 new tests, 51 total tests pass across 4 suites in common package
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows-common/src/types.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/decompressNodes.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/decompressNodes.test.ts
