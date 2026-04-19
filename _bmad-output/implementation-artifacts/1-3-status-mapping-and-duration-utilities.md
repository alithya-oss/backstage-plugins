# Story 1.3: Status Mapping and Duration Utilities

Status: done

## Story

As a plugin developer,
I want centralized status mapping (`PHASE_STATUS_MAP`, `PHASE_ICON_MAP`) and duration formatting utilities in the common package,
so that all UI components use identical phase-to-status and phase-to-icon mappings.

## Acceptance Criteria

1. `PHASE_STATUS_MAP` maps all 7 `NodePhase` values to BUI status strings (`success`, `danger`, `warning`, `info`, `secondary`)
2. `PHASE_ICON_MAP` maps all 7 `NodePhase` values to icon characters (`✓`, `✗`, `⚠`, `◌`, `○`, `⊘`, `—`)
3. `formatDuration(seconds: number): string` returns human-readable duration (e.g., `"3m 47s"`, `"12s"`, `"1h 5m"`)
4. Unit tests cover all phase mappings and duration edge cases (0s, negative, undefined)
5. All exports use `@public` JSDoc tags
6. `yarn tsc` compiles without errors
7. `yarn build` succeeds for the common package

## Tasks / Subtasks

- [x] Task 1: Create `statusMapping.ts` with `PHASE_STATUS_MAP` and `PHASE_ICON_MAP` (AC: #1, #2, #5)
  - [x] Define `BUIStatus` type alias: `'success' | 'danger' | 'warning' | 'info' | 'secondary'`
  - [x] Implement `PHASE_STATUS_MAP: Record<NodePhase, BUIStatus>` with exact mappings from architecture
  - [x] Implement `PHASE_ICON_MAP: Record<NodePhase, string>` with exact icon characters from architecture
  - [x] Add `@public` JSDoc tags to all exports
  - [x] Add Apache 2.0 license header

- [x] Task 2: Create `duration.ts` with `formatDuration` utility (AC: #3, #5)
  - [x] Implement `formatDuration(seconds: number | undefined): string`
  - [x] Handle hours + minutes: `"1h 5m"`
  - [x] Handle minutes + seconds: `"3m 47s"`
  - [x] Handle seconds only: `"12s"`
  - [x] Handle zero: `"0s"`
  - [x] Handle undefined/null input: `"—"`
  - [x] Handle negative input: `"—"`
  - [x] Add `@public` JSDoc tag
  - [x] Add Apache 2.0 license header

- [x] Task 3: Create `statusMapping.test.ts` (AC: #4)
  - [x] Test `PHASE_STATUS_MAP` maps all 7 `NodePhase` values to correct BUI status strings
  - [x] Test `PHASE_ICON_MAP` maps all 7 `NodePhase` values to correct icon characters
  - [x] Verify both maps have exactly 7 entries (no missing, no extra)

- [x] Task 4: Create `duration.test.ts` (AC: #4)
  - [x] Test seconds only: `formatDuration(12)` → `"12s"`
  - [x] Test minutes + seconds: `formatDuration(227)` → `"3m 47s"`
  - [x] Test hours + minutes: `formatDuration(3900)` → `"1h 5m"`
  - [x] Test hours + minutes + seconds (seconds dropped): `formatDuration(3947)` → `"1h 5m"`
  - [x] Test zero: `formatDuration(0)` → `"0s"`
  - [x] Test undefined: `formatDuration(undefined)` → `"—"`
  - [x] Test negative: `formatDuration(-5)` → `"—"`
  - [x] Test exactly 60 seconds: `formatDuration(60)` → `"1m 0s"`
  - [x] Test exactly 3600 seconds: `formatDuration(3600)` → `"1h 0m"`

- [x] Task 5: Update `index.ts` barrel exports (AC: #1, #2, #3)
  - [x] Export `PHASE_STATUS_MAP`, `PHASE_ICON_MAP`, `BUIStatus` from `./statusMapping`
  - [x] Export `formatDuration` from `./duration`

- [x] Task 6: Verify build (AC: #6, #7)
  - [x] Run `yarn tsc` — must compile without errors
  - [x] Run `yarn build` in the common package — must succeed

## Dev Notes

### Exact Status Mappings (MANDATORY — do not deviate)

From architecture.md and UX design specification:

```typescript
// statusMapping.ts
export const PHASE_STATUS_MAP: Record<NodePhase, BUIStatus> = {
  Succeeded: 'success',
  Failed: 'danger',
  Error: 'danger',
  Running: 'info',
  Pending: 'warning',
  Skipped: 'secondary',
  Omitted: 'secondary',
};

export const PHASE_ICON_MAP: Record<NodePhase, string> = {
  Succeeded: '✓',
  Failed: '✗',
  Error: '⚠',
  Running: '◌',
  Pending: '○',
  Skipped: '⊘',
  Omitted: '—',
};
```

These maps are the single source of truth for the entire plugin. They are consumed by:
- `WorkflowTable` status Badge (Epic 2)
- `NodeStatusDots` colored squares (Epic 3)
- `DAGNodeCard` border color and icon (Epic 3)
- `NodeDetailPanel` phase badge (Epic 3)

**Rule from architecture:** No component may define its own phase-to-color or phase-to-icon mapping. All must import from `statusMapping.ts`.

### Duration Formatting Rules

- When hours > 0: show `"{h}h {m}m"` — drop seconds (too noisy for table display)
- When minutes > 0 and hours = 0: show `"{m}m {s}s"`
- When only seconds: show `"{s}s"`
- Zero seconds: `"0s"`
- Undefined or negative: `"—"` (em dash, not hyphen)
- Duration is displayed in monospace font in the UI (UX-DR16), but that's a CSS concern — the utility just returns the string
- Input is always in seconds (number) per architecture API format (AR10)

### File Locations

- `plugins/argo-workflows-common/src/statusMapping.ts` — status maps
- `plugins/argo-workflows-common/src/statusMapping.test.ts` — status map tests
- `plugins/argo-workflows-common/src/duration.ts` — duration formatter
- `plugins/argo-workflows-common/src/duration.test.ts` — duration tests (note: architecture shows `duration.ts` in the project tree)
- `plugins/argo-workflows-common/src/index.ts` — barrel exports (update existing)

### Import Pattern

```typescript
// Other packages import like this:
import { PHASE_STATUS_MAP, PHASE_ICON_MAP, formatDuration } from '@backstage-community/plugin-argo-workflows-common';
```

### Existing Code Context

The common package already has:
- `types.ts` — `NodePhase`, `WorkflowPhase`, `NodeType`, `NodeStatus`, `NodeStatusSummary`, `WorkflowSummary`, `WorkflowDetail`
- `api.ts` — `argoWorkflowsApiRef`, `ArgoWorkflowsApi` interface
- `annotations.ts` — 3 annotation constants
- `index.ts` — barrel exports for all of the above

Import `NodePhase` from `./types` in `statusMapping.ts`. Do NOT re-declare the type.

### Testing Framework

Use Jest (via `backstage-cli package test`). Tests are co-located with source files per architecture convention (AR9). No separate `__tests__/` directory.

### License Header

All files must include the Apache 2.0 license header (copy from existing `types.ts`).

### What NOT to Do

- Do NOT create a `statusMapping.css` or any CSS file — this story is pure TypeScript utilities
- Do NOT add any React dependencies — the common package is pure TypeScript
- Do NOT add any new npm dependencies — everything needed is already available
- Do NOT modify `types.ts`, `api.ts`, or `annotations.ts` — they are complete from Story 1.2
- Do NOT create a `__tests__/` directory — tests are co-located

### Project Structure Notes

- Files go in `workspaces/argo-workflows/plugins/argo-workflows-common/src/`
- Architecture project tree shows `duration.ts` as a separate file (not inside `statusMapping.ts`)
- Test files co-located: `statusMapping.test.ts` and `duration.test.ts` (not in a subfolder)

### References

- [Source: architecture.md#Communication Patterns] — exact PHASE_STATUS_MAP and PHASE_ICON_MAP definitions
- [Source: architecture.md#Implementation Patterns] — naming conventions (UPPER_SNAKE constants, camelCase functions)
- [Source: architecture.md#Core Architectural Decisions] — status mapping centralized in common package (AR6)
- [Source: architecture.md#Enforcement Guidelines] — Rule #1: import status mapping from common, never define local maps
- [Source: ux-design-specification.md#Status Color Mapping] — BUI token mapping table confirming phase-to-status assignments
- [Source: epics.md#Story 1.3] — acceptance criteria and story statement
- [Source: _bmad-output/implementation-artifacts/1-2-shared-types-api-ref-and-annotation-constants.md] — previous story establishing types.ts with NodePhase type

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created `statusMapping.ts` with `PHASE_STATUS_MAP` (7 NodePhase → BUIStatus mappings) and `PHASE_ICON_MAP` (7 NodePhase → icon character mappings), all with `@public` JSDoc tags
- Created `duration.ts` with `formatDuration` utility handling hours+minutes, minutes+seconds, seconds-only, zero, undefined, and negative inputs
- Created `statusMapping.test.ts` with 17 tests covering all phase mappings and entry count validation
- Created `duration.test.ts` with 9 tests covering all edge cases
- Updated `index.ts` barrel exports with `BUIStatus`, `PHASE_STATUS_MAP`, `PHASE_ICON_MAP`, and `formatDuration`
- All 27 tests pass, build succeeds, lint clean (notice headers auto-fixed to "The Alithya Authors" 2026)

### File List

workspaces/argo-workflows/plugins/argo-workflows-common/src/statusMapping.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/statusMapping.test.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/duration.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/duration.test.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
