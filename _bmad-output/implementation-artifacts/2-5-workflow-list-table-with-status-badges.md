# Story 2.5: Workflow List Table with Status Badges

Status: done

## Story

As a service owner,
I want to see a table of my workflow executions with status badges, start times, and durations,
so that I can quickly assess the health of my workflows.

## Acceptance Criteria

1. `WorkflowTable` component renders a Backstage `Table` with columns: Name, Status, Started, Duration, Namespace
2. The Status column shows a themed Remixicon SVG icon + phase label, colored via BUI CSS custom properties (`--bui-fg-success`, `--bui-fg-danger`, `--bui-fg-info`, `--bui-fg-warning`, `--bui-fg-disabled`) — following the Flux community plugin pattern
3. The Name column displays the workflow name
4. The Started column shows relative time ("2 min ago", "1 hour ago") using the `startedAt` ISO 8601 string
5. The Duration column shows formatted duration in monospace font using `formatDuration` from common
6. The table supports sorting by Started and Duration columns via Backstage `Table` built-in sorting
7. The table supports pagination via Backstage `Table` built-in pagination with configurable page size (default 20)
8. A loading state shows the Backstage `Table` `isLoading` prop while data is being fetched
9. The `ArgoWorkflowsPage` component wires `useArgoWorkflows` to `WorkflowTable` using the entity from `useEntity`
10. Unit tests verify table rendering with mock workflow data, status mapping, and loading state

## Tasks / Subtasks

- [x] Task 1: Create `components/WorkflowTable/WorkflowTable.tsx` (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] Import `Table`, `TableColumn` from `@backstage/core-components`
  - [x] Import Remixicon SVG icons from `@remixicon/react`: `RiCheckboxCircleLine` (Succeeded), `RiErrorWarningLine` (Failed/Error), `RiRefreshLine` (Running), `RiTimeLine` (Pending)
  - [x] Import `WorkflowSummary`, `WorkflowPhase`, `formatDuration` from common
  - [x] Create `WorkflowStatusIndicator.module.css` with BUI-themed status classes (`.ok { fill: var(--bui-fg-success) }`, `.error { fill: var(--bui-fg-danger) }`, `.running { fill: var(--bui-fg-info) }`, `.pending { fill: var(--bui-fg-warning) }`)
  - [x] Define `WorkflowTableProps` interface: `{ workflows: WorkflowSummary[]; loading: boolean; }`
  - [x] Create `WorkflowStatusIndicator` component that maps `WorkflowPhase` to themed Remixicon + label
  - [x] Define `TableColumn<WorkflowSummary>[]` columns array:
    - Name: `field: 'name'`, renders workflow name as plain text
    - Status: `field: 'phase'`, renders `WorkflowStatusIndicator` with themed Remixicon icon + phase label
    - Started: `field: 'startedAt'`, renders relative time string, `customSort` by ISO date
    - Duration: `field: 'duration'`, renders `formatDuration(duration)` in monospace `<span>`, `customSort` by number
    - Namespace: `field: 'namespace'`, renders namespace string
  - [x] Create helper `formatRelativeTime(isoString: string): string` for "2 min ago" display
  - [x] Render `<Table>` with `isLoading={loading}`, `data={workflows}`, `columns`, `options={{ pageSize: 20, sorting: true, paging: true }}`
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 1b: Create `components/WorkflowTable/WorkflowStatusIndicator.module.css` (AC: #2)
  - [x] Define `.status` class for flex alignment (icon + label)
  - [x] Define `.statusIcon` class for icon sizing (20×20px) and margin
  - [x] Define `.ok` class: `fill: var(--bui-fg-success)` — for Succeeded
  - [x] Define `.error` class: `fill: var(--bui-fg-danger)` — for Failed, Error
  - [x] Define `.running` class: `fill: var(--bui-fg-info)` — for Running
  - [x] Define `.pending` class: `fill: var(--bui-fg-warning)` — for Pending

- [x] Task 2: Create `components/WorkflowTable/WorkflowTable.test.tsx` (AC: #10)
  - [x] Create mock `WorkflowSummary[]` test data with various phases
  - [x] Test: renders table with correct number of rows
  - [x] Test: displays workflow names in Name column
  - [x] Test: renders correct status indicator for each phase (Succeeded → StatusOK, Failed → StatusError, etc.)
  - [x] Test: displays formatted duration in Duration column
  - [x] Test: displays namespace in Namespace column
  - [x] Test: shows loading state when `loading` is true
  - [x] Test: renders empty table when workflows array is empty

- [x] Task 3: Create `components/WorkflowTable/index.ts` — barrel export
  - [x] Export `WorkflowTable` and `WorkflowTableProps`

- [x] Task 4: Update `components/ArgoWorkflowsPage.tsx` (AC: #9)
  - [x] Import `useEntity` from `@backstage/plugin-catalog-react`
  - [x] Import `useArgoWorkflows` from `../hooks`
  - [x] Import `WorkflowTable` from `./WorkflowTable`
  - [x] Get entity via `useEntity()`
  - [x] Call `useArgoWorkflows(entity)` to get `{ workflows, loading, error }`
  - [x] Render `<WorkflowTable workflows={workflows} loading={loading} />`
  - [x] For now, render error as a simple div (Story 2.7 will add proper error states)

- [x] Task 5: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass
  - [x] Run `yarn backstage-cli package build` — must succeed

## Dev Notes

### Architecture Contract

From architecture.md — the WorkflowTable component lives in:
```
plugins/argo-workflows/src/components/WorkflowTable/
├── WorkflowTable.tsx
├── WorkflowTable.test.tsx
└── index.ts
```

The `ArgoWorkflowsPage` is the routable extension entry point that wires hooks to components.

### Backstage Table Component

The Backstage `Table` component from `@backstage/core-components` is a wrapper around material-table. Key props:

```typescript
import { Table, TableColumn } from '@backstage/core-components';

const columns: TableColumn<WorkflowSummary>[] = [
  {
    title: 'Name',
    field: 'name',
  },
  {
    title: 'Status',
    field: 'phase',
    render: (row) => <WorkflowStatusIndicator phase={row.phase} />,
  },
  {
    title: 'Started',
    field: 'startedAt',
    render: (row) => formatRelativeTime(row.startedAt),
    customSort: (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    defaultSort: 'desc',
  },
  {
    title: 'Duration',
    field: 'duration',
    render: (row) => <span style={{ fontFamily: 'monospace' }}>{formatDuration(row.duration)}</span>,
    customSort: (a, b) => (a.duration ?? 0) - (b.duration ?? 0),
  },
  {
    title: 'Namespace',
    field: 'namespace',
  },
];

<Table
  title="Argo Workflows"
  columns={columns}
  data={workflows}
  isLoading={loading}
  options={{
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
    sorting: true,
    paging: true,
  }}
/>
```

### Themed Remixicon Status Icons (Flux Plugin Pattern)

Follow the same pattern as `@backstage-community/plugin-flux` — use `@remixicon/react` SVG icons themed with BUI CSS custom properties via CSS modules.

**Icon mapping (WorkflowPhase → Remixicon):**

```typescript
import {
  RiCheckboxCircleLine,   // Succeeded — green
  RiErrorWarningLine,     // Failed, Error — red
  RiRefreshLine,          // Running — blue
  RiTimeLine,             // Pending — yellow
} from '@remixicon/react';
```

**CSS module (`WorkflowStatusIndicator.module.css`):**

```css
@layer components {
  .status {
    align-items: center;
    display: flex;
  }

  .statusIcon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-right: var(--bui-space-2);
  }

  .ok {
    fill: var(--bui-fg-success);
  }

  .error {
    fill: var(--bui-fg-danger);
  }

  .running {
    fill: var(--bui-fg-info);
  }

  .pending {
    fill: var(--bui-fg-warning);
  }
}
```

**Component:**

```tsx
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiTimeLine,
} from '@remixicon/react';
import classNames from 'classnames';
import styles from './WorkflowStatusIndicator.module.css';

function WorkflowStatusIndicator({ phase }: { phase: WorkflowPhase }) {
  switch (phase) {
    case 'Succeeded':
      return (
        <span className={styles.status}>
          <RiCheckboxCircleLine className={classNames(styles.statusIcon, styles.ok)} />
          Succeeded
        </span>
      );
    case 'Failed':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine className={classNames(styles.statusIcon, styles.error)} />
          Failed
        </span>
      );
    case 'Error':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine className={classNames(styles.statusIcon, styles.error)} />
          Error
        </span>
      );
    case 'Running':
      return (
        <span className={styles.status}>
          <RiRefreshLine className={classNames(styles.statusIcon, styles.running)} />
          Running
        </span>
      );
    case 'Pending':
      return (
        <span className={styles.status}>
          <RiTimeLine className={classNames(styles.statusIcon, styles.pending)} />
          Pending
        </span>
      );
    default:
      return <span>{phase}</span>;
  }
}
```

This approach:
- Inherits BUI theme colors automatically (light/dark mode support)
- Uses SVG `fill` for coloring — works with any BUI theme
- Matches the visual style of the Flux community plugin
- Icons are tree-shakeable from `@remixicon/react`

### Relative Time Formatting

Create a simple `formatRelativeTime` helper — do NOT add a dependency like `date-fns` or `moment`:

```typescript
function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}
```

### useEntity Hook

From `@backstage/plugin-catalog-react`:
```typescript
import { useEntity } from '@backstage/plugin-catalog-react';

const { entity } = useEntity();
```

This is available because `EntityArgoWorkflowsContent` is mounted within the entity page context.

### Testing Pattern

For testing the Backstage `Table` component, render with `@backstage/test-utils` wrappers:

```typescript
import { renderInTestApp } from '@backstage/test-utils';

// The Table component needs a ThemeProvider context
// renderInTestApp provides this automatically
```

Mock data:
```typescript
const mockWorkflows: WorkflowSummary[] = [
  {
    name: 'deploy-prod-abc123',
    namespace: 'production',
    phase: 'Succeeded',
    startedAt: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    finishedAt: new Date(Date.now() - 60000).toISOString(),
    duration: 227,
    nodes: [],
  },
  {
    name: 'deploy-staging-def456',
    namespace: 'staging',
    phase: 'Failed',
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    duration: 45,
    nodes: [],
  },
  {
    name: 'build-main-ghi789',
    namespace: 'ci',
    phase: 'Running',
    startedAt: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    nodes: [],
  },
];
```

### File Locations

- `plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx` — NEW
- `plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.test.tsx` — NEW
- `plugins/argo-workflows/src/components/WorkflowTable/WorkflowStatusIndicator.module.css` — NEW
- `plugins/argo-workflows/src/components/WorkflowTable/index.ts` — NEW
- `plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx` — UPDATE (replace placeholder)

### Dependencies

Existing dependencies already in `package.json`:
- `@backstage/core-components` — `Table`, `TableColumn`
- `@backstage/plugin-catalog-react` — `useEntity`
- `@backstage-community/plugin-argo-workflows-common` — types, `formatDuration`
- `@backstage/test-utils` (dev dep) — `renderInTestApp`
- `@testing-library/react` (dev dep) — `screen`, `waitFor`

New dependencies to ADD to `package.json`:
- `@remixicon/react` — Remixicon SVG React components (tree-shakeable)
- `classnames` — CSS class composition utility (used by Flux plugin)

Both are already used by `@backstage-community/plugin-flux` in this same repo pattern.

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — known issue, ignore
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `@public` JSDoc tags required on all exported symbols
- Trim and validate annotation values (empty/whitespace treated as missing) — done in `useArgoWorkflows`
- `usePolling` validates `intervalMs` > 0 — always pass a valid number
- Tests use `jest.useFakeTimers()` and `jest.useRealTimers()` for timer-dependent tests
- `renderHook` from `@testing-library/react` for hook tests; `renderInTestApp` from `@backstage/test-utils` for component tests that need Backstage context

### What NOT to Do

- Do NOT add date-fns, moment, or lodash — use the simple `formatRelativeTime` helper
- Do NOT use Backstage's built-in `StatusOK`/`StatusError` components — use themed Remixicon icons per Flux plugin pattern
- Do NOT use Material UI directly — use Backstage core-components + BUI CSS custom properties
- Do NOT implement filters or search — that's Story 2.6
- Do NOT implement empty/error states — that's Story 2.7
- Do NOT implement expandable rows — that's Story 3.4
- Do NOT implement NodeStatusDots — that's Story 3.6
- Do NOT modify the common package or backend
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT hardcode status colors — use BUI CSS custom properties (`--bui-fg-success`, `--bui-fg-danger`, etc.)
- Do NOT use inline styles for icon colors — use CSS modules with `fill` property

### References

- [Source: architecture.md#Frontend Architecture] — component structure, hook architecture
- [Source: architecture.md#Structure Patterns] — WorkflowTable directory layout
- [Source: architecture.md#Naming Patterns] — PascalCase components, co-located tests
- [Source: architecture.md#Communication Patterns] — PHASE_STATUS_MAP single source of truth
- [Source: epics.md#Story 2.5] — acceptance criteria
- [Source: ux-design-specification.md#Implementation Approach] — BUI Table with useTable, columns spec
- [Source: ux-design-specification.md#Component Strategy] — Table + useTable, CellText, Badge usage
- [Source: @backstage-community/plugin-flux KubeStatusIndicator] — Remixicon + BUI CSS custom properties pattern for themed status icons
- [Source: @backstage-community/plugin-flux utils.module.css] — CSS module pattern with `fill: var(--bui-fg-*)` for SVG icon theming

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Implemented `WorkflowTable` component with Backstage `Table` and 5 columns (Name, Status, Started, Duration, Namespace)
- Status column uses themed Remixicon SVG icons (`@remixicon/react`) with BUI CSS custom properties via CSS modules — matching Flux plugin pattern
- `WorkflowStatusIndicator` maps WorkflowPhase to `RiCheckboxCircleLine` (Succeeded), `RiErrorWarningLine` (Failed/Error), `RiRefreshLine` (Running), `RiTimeLine` (Pending)
- `formatRelativeTime` helper provides "just now", "X min ago", "X hours ago", "X days ago" display
- Duration column uses monospace font via inline style, `formatDuration` from common package
- Started column sorts by ISO date descending by default, Duration sorts by numeric value
- Pagination enabled with page sizes 10/20/50, default 20
- `ArgoWorkflowsPage` wired with `useEntity` + `useArgoWorkflows` → `WorkflowTable`
- Added `@remixicon/react` and `classnames` as new dependencies
- 8 new tests pass, 53 total tests pass across frontend plugin
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowStatusIndicator.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx
workspaces/argo-workflows/plugins/argo-workflows/package.json
