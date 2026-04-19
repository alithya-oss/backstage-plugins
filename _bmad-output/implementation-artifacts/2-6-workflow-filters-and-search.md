# Story 2.6: Workflow Filters and Search

Status: done

## Story

As a service owner,
I want to filter workflows by status and search by name,
so that I can quickly find the workflow I'm looking for.

## Acceptance Criteria

1. A `WorkflowFilters` component renders above the table with status filter chips and a search input
2. Filter chips are displayed for: All, Succeeded, Failed, Running, Pending, Error
3. Clicking a filter chip toggles that status filter (multiple can be active simultaneously)
4. Clicking "All" clears all active filters and shows all workflows
5. A search input filters workflows by name (client-side case-insensitive substring match)
6. When filters/search result in zero matches, "No workflows match the current filters" is shown with a "Clear filters" link
7. A poll indicator ("● Updated Xs ago") is displayed at the right end of the filter toolbar
8. The `useArgoWorkflows` hook is updated to expose `lastUpdated` from `usePolling`
9. Unit tests verify filter toggling, search filtering, combined filter+search, empty filter state, and poll indicator

## Tasks / Subtasks

- [x] Task 1: Update `useArgoWorkflows` hook to expose `lastUpdated` (AC: #8)
  - [x] Add `lastUpdated: Date | null` to the return type
  - [x] Pass through `lastUpdated` from `usePolling`
  - [x] Update existing tests to verify `lastUpdated` is returned
  - [x] Update barrel export if needed

- [x] Task 2: Create `components/WorkflowTable/WorkflowFilters.tsx` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Define `WorkflowFiltersProps` interface: `{ phases: WorkflowPhase[]; onPhasesChange: (phases: WorkflowPhase[]) => void; searchText: string; onSearchChange: (text: string) => void; lastUpdated: Date | null; }`
  - [x] Render a flex row container with filter chips on the left and poll indicator on the right
  - [x] Render "All" chip + one chip per status: Succeeded, Failed, Running, Pending, Error
  - [x] "All" chip is active (filled) when `phases` array is empty; clicking it clears all filters
  - [x] Status chips toggle: clicking an active chip removes it from `phases`; clicking an inactive chip adds it
  - [x] Render a search `<input>` with placeholder "Search by name…" and a search icon
  - [x] Render poll indicator: green dot `●` + "Updated Xs ago" using `lastUpdated`, or "—" if null
  - [x] Use CSS module `WorkflowFilters.module.css` for layout and chip styling
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 3: Create `components/WorkflowTable/WorkflowFilters.module.css` (AC: #1, #7)
  - [x] `.toolbar` — flex row, `align-items: center`, `gap: var(--bui-space-3)`, `margin-bottom: var(--bui-space-4)`
  - [x] `.chips` — flex row, `gap: var(--bui-space-2)`, `flex-wrap: wrap`
  - [x] `.chip` — base chip style: `border: 1px solid var(--bui-border-default)`, `border-radius: 16px`, `padding: 4px 12px`, `cursor: pointer`, `background: transparent`, `font-size: 13px`
  - [x] `.chipActive` — active chip: `background: var(--bui-bg-info)`, `border-color: var(--bui-fg-info)`, `color: var(--bui-fg-on-info)`
  - [x] `.searchInput` — styled input with border, padding, border-radius
  - [x] `.pollIndicator` — `margin-left: auto`, `display: flex`, `align-items: center`, `gap: var(--bui-space-1)`, `font-size: 12px`, `color: var(--bui-fg-secondary)`
  - [x] `.pollDot` — `width: 8px`, `height: 8px`, `border-radius: 50%`, `background: var(--bui-fg-success)`
  - [x] `.emptyFilters` — centered text with "Clear filters" link styling

- [x] Task 4: Update `WorkflowTable.tsx` to integrate filters (AC: #1, #3, #5, #6)
  - [x] Add `lastUpdated: Date | null` to `WorkflowTableProps`
  - [x] Add `useState<WorkflowPhase[]>([])` for active phase filters
  - [x] Add `useState<string>('')` for search text
  - [x] Compute `filteredWorkflows` by applying phase filter + search text to `workflows` prop
  - [x] Render `<WorkflowFilters>` above the `<Table>`
  - [x] When `filteredWorkflows` is empty and `workflows` is not empty, show empty filter message instead of table
  - [x] Pass `filteredWorkflows` to `<Table data={...}>`

- [x] Task 5: Update `ArgoWorkflowsPage.tsx` to pass `lastUpdated` (AC: #7, #8)
  - [x] Destructure `lastUpdated` from `useArgoWorkflows(entity)`
  - [x] Pass `lastUpdated` to `<WorkflowTable>`

- [x] Task 6: Create `components/WorkflowTable/WorkflowFilters.test.tsx` (AC: #9)
  - [x] Test: renders all filter chips (All, Succeeded, Failed, Running, Pending, Error)
  - [x] Test: clicking a status chip calls `onPhasesChange` with that phase added
  - [x] Test: clicking an active chip calls `onPhasesChange` with that phase removed
  - [x] Test: clicking "All" calls `onPhasesChange` with empty array
  - [x] Test: typing in search input calls `onSearchChange`
  - [x] Test: poll indicator shows "Updated Xs ago" when `lastUpdated` is provided
  - [x] Test: poll indicator shows "—" when `lastUpdated` is null

- [x] Task 7: Update `WorkflowTable.test.tsx` for filter integration (AC: #9)
  - [x] Test: filters workflows by phase when filter chips are clicked
  - [x] Test: filters workflows by name when search text is entered
  - [x] Test: combined filter + search narrows results correctly
  - [x] Test: shows empty filter message when filters match nothing
  - [x] Test: "Clear filters" link resets filters and shows all workflows

- [x] Task 8: Update barrel export `components/WorkflowTable/index.ts`
  - [x] Export `WorkflowFilters` and `WorkflowFiltersProps`

- [x] Task 9: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass
  - [x] Run `yarn backstage-cli package build` — must succeed

## Dev Notes

### Architecture Contract

From architecture.md — `WorkflowFilters` lives inside the `WorkflowTable/` directory:
```
plugins/argo-workflows/src/components/WorkflowTable/
├── WorkflowTable.tsx          ← UPDATE (add filter state + integration)
├── WorkflowTable.test.tsx     ← UPDATE (add filter integration tests)
├── WorkflowFilters.tsx        ← NEW
├── WorkflowFilters.test.tsx   ← NEW
├── WorkflowFilters.module.css ← NEW
├── WorkflowStatusIndicator.module.css  (existing)
└── index.ts                   ← UPDATE (add WorkflowFilters export)
```

Also update:
- `hooks/useArgoWorkflows.ts` — expose `lastUpdated`
- `hooks/useArgoWorkflows.test.ts` — verify `lastUpdated`
- `components/ArgoWorkflowsPage.tsx` — pass `lastUpdated` to `WorkflowTable`

### Filtering Strategy: Client-Side Only

All filtering and searching is client-side. The backend already returns all workflows for the entity's namespace+labelSelector. The `WorkflowTable` component applies filters to the `workflows` prop before passing to the Backstage `Table`.

```typescript
const filteredWorkflows = useMemo(() => {
  let result = workflows;

  // Phase filter
  if (activePhases.length > 0) {
    result = result.filter(w => activePhases.includes(w.phase));
  }

  // Search filter (case-insensitive substring)
  if (searchText.trim()) {
    const lower = searchText.trim().toLowerCase();
    result = result.filter(w => w.name.toLowerCase().includes(lower));
  }

  return result;
}, [workflows, activePhases, searchText]);
```

### Filter Chip Behavior

- "All" chip is a special chip — it's active when NO phase filters are selected
- Status chips are toggleable — clicking adds/removes from the active set
- Multiple status chips can be active simultaneously (OR logic: show workflows matching ANY active phase)
- When "All" is clicked, clear the `activePhases` array

```typescript
const phases: WorkflowPhase[] = ['Succeeded', 'Failed', 'Running', 'Pending', 'Error'];

function handleChipClick(phase: WorkflowPhase) {
  if (activePhases.includes(phase)) {
    onPhasesChange(activePhases.filter(p => p !== phase));
  } else {
    onPhasesChange([...activePhases, phase]);
  }
}

function handleAllClick() {
  onPhasesChange([]);
}
```

### Poll Indicator

The poll indicator shows when data was last refreshed. It uses `lastUpdated` from `usePolling` (exposed through `useArgoWorkflows`).

```typescript
function formatPollTime(lastUpdated: Date | null): string {
  if (!lastUpdated) return '—';
  const diffSec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}
```

Display: `● Updated 5s ago` — green dot + text, right-aligned in the toolbar.

### useArgoWorkflows Update

The hook currently returns `{ workflows, loading, error }`. Add `lastUpdated`:

```typescript
// Before
return { workflows: data ?? [], loading, error: missingNamespaceError ?? error };

// After
return { workflows: data ?? [], loading, error: missingNamespaceError ?? error, lastUpdated };
```

### Empty Filter State

When filters produce zero results but the original `workflows` array is non-empty, show:
```
No workflows match the current filters.  [Clear filters]
```

The "Clear filters" link resets both `activePhases` to `[]` and `searchText` to `''`.

### Chip Styling with BUI CSS Custom Properties

Use BUI tokens for chip colors to support light/dark themes:
- Inactive chip: `border: 1px solid var(--bui-border-default)`, transparent background
- Active chip: `background: var(--bui-bg-info)`, `border-color: var(--bui-fg-info)`, `color: var(--bui-fg-on-info)`

Do NOT use hardcoded colors. Do NOT use Material UI Chip component.

### Accessibility Notes (Story 2.6 Scope)

Basic accessibility for filter chips:
- Each chip should be a `<button>` element (natively focusable and keyboard-activatable)
- Use `aria-pressed="true|false"` to indicate active state
- Search input should have an associated `<label>` (can be visually hidden)

Full keyboard navigation and screen reader support is Story 4.1 scope — don't over-engineer here.

### Testing Patterns

- Use `renderInTestApp` from `@backstage/test-utils` for component tests (provides Backstage context)
- Use `@testing-library/user-event` for click and type interactions
- Use `screen.getByRole('button', { name: /Succeeded/ })` to find filter chips
- Use `screen.getByPlaceholderText('Search by name…')` to find search input
- Mock `lastUpdated` as `new Date()` for poll indicator tests

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — known issue, ignore
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- `@public` JSDoc tags required on all exported symbols
- Trim and validate user inputs (empty/whitespace treated as missing)
- `renderInTestApp` from `@backstage/test-utils` for component tests needing Backstage context
- Backstage `Table` component is a wrapper around material-table
- CSS modules with BUI custom properties for themed styling (Flux plugin pattern)
- `formatRelativeTime` already exists in `WorkflowTable.tsx` — do NOT duplicate; the poll indicator uses a simpler `formatPollTime` that shows seconds/minutes

### What NOT to Do

- Do NOT add any new npm dependencies — everything needed is already installed
- Do NOT use Material UI Chip, TextField, or any MUI components — use plain HTML + CSS modules with BUI tokens
- Do NOT implement server-side filtering — all filtering is client-side
- Do NOT modify the backend plugin
- Do NOT modify the common package
- Do NOT implement empty/error states for API errors — that's Story 2.7
- Do NOT implement keyboard navigation beyond native button/input behavior — that's Story 4.1
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT duplicate `formatRelativeTime` — the poll indicator uses its own simpler `formatPollTime`
- Do NOT use `useState` inside `WorkflowFilters` — it's a controlled component, state lives in `WorkflowTable`

### References

- [Source: architecture.md#Frontend Architecture] — filter state managed via `useState` in WorkflowTable
- [Source: architecture.md#Structure Patterns] — WorkflowFilters.tsx lives in WorkflowTable/ directory
- [Source: architecture.md#Naming Patterns] — PascalCase components, co-located tests
- [Source: epics.md#Story 2.6] — acceptance criteria
- [Source: ux-design-specification.md#Filter Chips] — toggle behavior, "All" clears filters
- [Source: ux-design-specification.md#Poll Indicator] — green dot + "Updated Xs ago" format
- [Source: ux-design-specification.md#Empty States] — "No workflows match the current filters" with "Clear filters" link

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Updated `useArgoWorkflows` hook to expose `lastUpdated` from `usePolling` — 2 new tests added
- Created `WorkflowFilters` controlled component with status filter chips (All, Succeeded, Failed, Running, Pending, Error), search input, and poll indicator
- Created `WorkflowFilters.module.css` with BUI CSS custom properties for themed chip styling
- Integrated filters into `WorkflowTable` — client-side phase filtering (OR logic) + case-insensitive name search via `useMemo`
- Empty filter state shows "No workflows match the current filters" with "Clear filters" link
- Poll indicator displays green dot + "Updated Xs ago" using `formatPollTime` helper
- Updated `ArgoWorkflowsPage` to pass `lastUpdated` through to `WorkflowTable`
- 9 new WorkflowFilters tests, 6 new WorkflowTable integration tests, 2 new useArgoWorkflows tests — 70 total tests pass
- Build succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useArgoWorkflows.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/useArgoWorkflows.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowFilters.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowFilters.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowFilters.module.css
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/WorkflowTable.test.tsx
workspaces/argo-workflows/plugins/argo-workflows/src/components/WorkflowTable/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx
