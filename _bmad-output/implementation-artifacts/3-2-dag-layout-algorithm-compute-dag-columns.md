# Story 3.2: DAG Layout Algorithm (computeDAGColumns)

Status: done

## Code Review Record

**Reviewed:** 2026-04-19
**Reviewer:** Kiro (3-layer adversarial review)

### Findings

| Severity | Count | Notes |
|----------|-------|-------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 2 | Defensive edge cases (null input, duplicate child IDs) — not blockers |
| Low | 5 | Minor improvements (type safety, test coverage gaps) |

### Acceptance Criteria

All 9 ACs verified ✅

### Verdict

**APPROVED** — Implementation satisfies all acceptance criteria. Medium-severity findings are defensive improvements for malformed input, not blockers for well-formed Argo Workflows API responses.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin developer,
I want a topological sort algorithm that transforms the flat node list into ordered columns for horizontal rendering,
so that the DAG card flow can display nodes in correct execution order with parallel branches grouped.

## Acceptance Criteria

1. Given a `NodeStatus[]` array from a workflow detail response, when `computeDAGColumns(nodes)` is called, then it returns a `DAGColumn[]` array ordered left-to-right by execution stage
2. Each `DAGColumn` contains `nodes: NodeStatus[]` (parallel nodes) and `isParallel: boolean`
3. Nodes at the same topological level are grouped into the same column
4. Boundary nodes (type DAG, Steps, StepGroup) are filtered out — only execution nodes appear
5. The algorithm handles linear workflows (single node per column)
6. The algorithm handles fan-out/fan-in patterns (multiple nodes in parallel columns)
7. The algorithm handles workflows with a single node
8. The algorithm returns an empty array for empty input
9. Unit tests cover: linear, parallel, fan-out/fan-in, single node, empty, and malformed data

## Tasks / Subtasks

- [x] Task 1: Create `DAGColumn` interface in `types.ts` (AC: #2)
  - [x] Add `DAGColumn` interface with `nodes: NodeStatus[]` and `isParallel: boolean`
  - [x] Add `@public` JSDoc tag
  - [x] Export `DAGColumn` from `types.ts`

- [x] Task 2: Export `DAGColumn` from `index.ts` (AC: #2)
  - [x] Add `DAGColumn` to the type exports in `src/index.ts`

- [x] Task 3: Create `computeDAGColumns.ts` with the algorithm (AC: #1, #3, #4, #5, #6, #7, #8)
  - [x] Create file `plugins/argo-workflows-common/src/computeDAGColumns.ts`
  - [x] Add Alithya license header
  - [x] Import `NodeStatus` and `DAGColumn` from `./types`
  - [x] Define `BOUNDARY_TYPES` set: `new Set(['DAG', 'Steps', 'StepGroup'])`
  - [x] Implement `computeDAGColumns(nodes: NodeStatus[]): DAGColumn[]` using Kahn's algorithm:
    1. Return `[]` for empty/undefined input
    2. Filter out boundary nodes (type in BOUNDARY_TYPES)
    3. Build adjacency map and in-degree map from `children` arrays (only edges between non-boundary nodes)
    4. Initialize BFS queue with all nodes having in-degree 0
    5. Process level-by-level: dequeue all current zero-in-degree nodes as one column, decrement in-degrees of their children, enqueue newly zero-in-degree nodes
    6. Each level becomes a `DAGColumn` with `isParallel = nodes.length > 1`
    7. Handle orphan nodes (nodes not referenced by any children array) — they should appear as roots (in-degree 0)
  - [x] Add `@public` JSDoc tag on the exported function

- [x] Task 4: Export `computeDAGColumns` from `index.ts` (AC: #1)
  - [x] Add `computeDAGColumns` to the function exports in `src/index.ts`

- [x] Task 5: Create `computeDAGColumns.test.ts` with comprehensive tests (AC: #5, #6, #7, #8, #9)
  - [x] Test: returns empty array for empty input
  - [x] Test: returns empty array for undefined input
  - [x] Test: handles single execution node — returns one column with one node, isParallel=false
  - [x] Test: handles linear workflow (A→B→C) — returns 3 columns, each with 1 node, all isParallel=false
  - [x] Test: handles fan-out pattern (A→B, A→C) — column 1 has [A], column 2 has [B,C] with isParallel=true
  - [x] Test: handles fan-in pattern (A→C, B→C) — column 1 has [A,B] isParallel=true, column 2 has [C]
  - [x] Test: handles diamond/fan-out-fan-in (A→B, A→C, B→D, C→D) — 3 columns: [A], [B,C], [D]
  - [x] Test: filters out boundary nodes (DAG, Steps, StepGroup) — only execution nodes in output
  - [x] Test: returns empty array when all nodes are boundary nodes
  - [x] Test: handles nodes with no children (leaf nodes)
  - [x] Test: handles malformed data — nodes with children referencing non-existent IDs
  - [x] Test: handles nodes with undefined/null children arrays gracefully
  - [x] Test: preserves all NodeStatus fields in output nodes (id, displayName, type, phase, etc.)

- [x] Task 6: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` in `plugins/argo-workflows-common` — all tests pass
  - [x] Run `yarn backstage-cli package build` in `plugins/argo-workflows-common` — succeeds

## Dev Notes

### Architecture Contract

From architecture.md — `computeDAGColumns` is a pure function in `argo-workflows-common`:

```typescript
function computeDAGColumns(nodes: NodeStatus[]): DAGColumn[];

interface DAGColumn {
  nodes: NodeStatus[];  // parallel nodes in this column
  isParallel: boolean;  // true if column has >1 node
}
```

**Algorithm (Kahn's algorithm — BFS topological sort):**
1. Build adjacency list from `children` arrays
2. Topological sort using Kahn's algorithm (BFS with in-degree tracking)
3. Group nodes into columns by topological level (nodes at the same level execute in parallel)
4. Filter out boundary nodes (type DAG/Steps/StepGroup) — these are structural, not execution nodes
5. Return ordered columns left-to-right

**Key design decisions:**
- Pure function with no side effects — easily unit testable
- Lives in `argo-workflows-common` so it can be reused by `argo-workflows-react` in Phase 2
- No external library needed — Kahn's algorithm is ~30 lines of TypeScript
- NO React, NO Node.js — pure TypeScript only

### Files to Create/Modify

**Create (2 files):**
- `plugins/argo-workflows-common/src/computeDAGColumns.ts` — the algorithm
- `plugins/argo-workflows-common/src/computeDAGColumns.test.ts` — tests

**Modify (2 files):**
- `plugins/argo-workflows-common/src/types.ts` — add `DAGColumn` interface
- `plugins/argo-workflows-common/src/index.ts` — export `DAGColumn` type and `computeDAGColumns` function

### Algorithm Implementation Guide

**Kahn's Algorithm (level-by-level BFS):**

```typescript
export function computeDAGColumns(nodes: NodeStatus[]): DAGColumn[] {
  if (!nodes || nodes.length === 0) return [];

  // 1. Filter out boundary nodes
  const execNodes = nodes.filter(n => !BOUNDARY_TYPES.has(n.type));
  if (execNodes.length === 0) return [];

  // 2. Build node map and in-degree map
  const nodeMap = new Map<string, NodeStatus>();
  const inDegree = new Map<string, number>();
  for (const node of execNodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
  }

  // 3. Build adjacency and compute in-degrees
  //    Only count edges where BOTH source and target are execution nodes
  for (const node of execNodes) {
    for (const childId of node.children ?? []) {
      if (nodeMap.has(childId)) {
        inDegree.set(childId, (inDegree.get(childId) ?? 0) + 1);
      }
    }
  }

  // 4. BFS level-by-level
  let queue = [...nodeMap.keys()].filter(id => inDegree.get(id) === 0);
  const columns: DAGColumn[] = [];

  while (queue.length > 0) {
    const levelNodes = queue.map(id => nodeMap.get(id)!);
    columns.push({
      nodes: levelNodes,
      isParallel: levelNodes.length > 1,
    });

    const nextQueue: string[] = [];
    for (const id of queue) {
      const node = nodeMap.get(id)!;
      for (const childId of node.children ?? []) {
        if (!nodeMap.has(childId)) continue;
        const newDeg = (inDegree.get(childId) ?? 1) - 1;
        inDegree.set(childId, newDeg);
        if (newDeg === 0) {
          nextQueue.push(childId);
        }
      }
    }
    queue = nextQueue;
  }

  return columns;
}
```

### Critical Edge Cases

**1. Boundary Node Filtering:**
The `children` arrays in boundary nodes (DAG, Steps, StepGroup) may reference execution nodes. When building the adjacency graph, ONLY consider edges between execution nodes. If a boundary node's child is an execution node, that edge is ignored — the execution node becomes a root (in-degree 0) unless another execution node also references it.

**2. Children Referencing Non-Existent Nodes:**
A node's `children` array may reference IDs that don't exist in the input (e.g., nodes from a different boundary scope). Skip these silently — only count edges where both source and target are in the filtered execution node set.

**3. Orphan Nodes:**
Nodes with no incoming edges (in-degree 0) and no outgoing edges (no children) should appear as a single-node column. This handles the single-node workflow case.

**4. Empty Children Arrays:**
`children` may be `undefined`, `null`, or `[]`. The algorithm must handle all three — use `node.children ?? []` for safe iteration.

**5. Cycle Detection (defensive):**
Argo Workflows are DAGs by definition, but malformed data could theoretically contain cycles. If the BFS terminates before all nodes are placed (some nodes never reach in-degree 0), those nodes are unreachable. For MVP, silently drop them — don't crash.

### Existing Code Patterns to Follow

**File naming:** `computeDAGColumns.ts` (camelCase utility) per architecture naming conventions.

**Test file:** `computeDAGColumns.test.ts` co-located in same directory.

**License header:** "The Alithya Authors" 2026, Apache 2.0.

**JSDoc:** `@public` tag on all exported symbols.

**Test patterns** (from `statusMapping.test.ts`):
- Import from local file: `import { computeDAGColumns } from './computeDAGColumns'`
- Import types: `import { NodeStatus } from './types'`
- Use `describe`/`it` blocks
- Use `it.each` for parameterized tests where appropriate

**Index exports** (from `src/index.ts`):
```typescript
export type { DAGColumn } from './types';
export { computeDAGColumns } from './computeDAGColumns';
```

### What NOT to Do

- Do NOT add any new npm dependencies — this is pure TypeScript, no libraries needed
- Do NOT use React or any frontend framework — this is a common package utility
- Do NOT use Node.js APIs — this must work in both browser and Node environments
- Do NOT modify the backend plugin — this is a common-package-only story
- Do NOT modify the frontend plugin — this is a common-package-only story
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT handle nested DAG/Steps decompression — that's Phase 2
- Do NOT add React Flow or elkjs — MVP uses CSS flexbox card flow
- Do NOT use `console.log` or any logging — pure function, no side effects
- Do NOT mutate the input `nodes` array — return new objects

### Previous Story Learnings (from Story 3.1)

- License headers must be "The Alithya Authors" 2026
- `@public` JSDoc tags required on all exported symbols
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- Pre-existing `plugin.test.ts` failure in backend (TodoListService import) — unrelated, ignore
- Pre-existing ESLint/TS errors in frontend plugin — unrelated, ignore
- `BOUNDARY_NODE_TYPES` set pattern already used in `workflowMapper.ts` — follow same pattern
- Story 3.1 code review noted `VALID_NODE_TYPES` manually maintained — same applies here for `BOUNDARY_TYPES`
- The backend `mapCrdToWorkflowDetail` INCLUDES boundary nodes in the response — `computeDAGColumns` must filter them out

### How This Connects to Other Stories

- **Story 3.1 (done):** Backend returns `WorkflowDetail` with full `NodeStatus[]` including boundary nodes
- **Story 3.2 (this):** `computeDAGColumns` takes that `NodeStatus[]`, filters boundary nodes, and produces `DAGColumn[]`
- **Story 3.4 (future):** `DAGCardFlow` component calls `computeDAGColumns(workflow.nodes)` to get columns for rendering
- **Story 3.5 (future):** `DAGNodeCard` renders individual nodes from the columns

### Project Structure Notes

All changes are within the common package:
```
plugins/argo-workflows-common/src/
├── types.ts               ← ADD DAGColumn interface
├── index.ts               ← ADD exports
├── computeDAGColumns.ts   ← NEW
├── computeDAGColumns.test.ts ← NEW
├── annotations.ts         (no change)
├── api.ts                 (no change)
├── statusMapping.ts       (no change)
├── statusMapping.test.ts  (no change)
├── duration.ts            (no change)
├── duration.test.ts       (no change)
└── setupTests.ts          (no change)
```

### References

- [Source: architecture.md#DAG Layout Algorithm] — Kahn's algorithm, `computeDAGColumns` signature, `DAGColumn` interface
- [Source: architecture.md#Structure Patterns] — Common package structure with `computeDAGColumns.ts`
- [Source: architecture.md#Naming Patterns] — camelCase utilities, co-located tests
- [Source: architecture.md#Architectural Boundaries] — Common package: NO React, NO Node.js, pure TypeScript
- [Source: epics.md#Story 3.2] — Acceptance criteria for DAG layout algorithm
- [Source: argo-workflows-common/src/types.ts] — `NodeStatus`, `NodeType` type definitions
- [Source: argo-workflows-common/src/index.ts] — Existing barrel exports pattern
- [Source: argo-workflows-backend/src/mappers/workflowMapper.ts] — `BOUNDARY_NODE_TYPES` set pattern

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `DAGColumn` interface to `types.ts` with `nodes: NodeStatus[]` and `isParallel: boolean`
- Created `computeDAGColumns.ts` implementing Kahn's algorithm (BFS topological sort) — ~40 lines of pure TypeScript
- Filters boundary nodes (DAG, Steps, StepGroup), builds in-degree map from `children` edges, processes level-by-level
- Handles all edge cases: empty input, single node, linear, fan-out, fan-in, diamond, orphan nodes, missing children refs, undefined children
- 13 new tests, 40 total tests pass across 3 suites in common package
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows-common/src/types.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/computeDAGColumns.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/computeDAGColumns.test.ts
