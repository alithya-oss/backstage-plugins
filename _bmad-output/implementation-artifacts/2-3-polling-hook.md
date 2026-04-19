# Story 2.3: Polling Hook

Status: done

## Story

As a service owner,
I want the workflow data to refresh automatically at appropriate intervals,
so that I see current workflow status without manually refreshing the page.

## Acceptance Criteria

1. `usePolling` hook accepts a fetch function, interval in milliseconds, and optional `enabled` and `stopWhen` parameters
2. It returns `{ data, loading, error, lastUpdated }`
3. `loading` is `true` only on initial fetch — polling refreshes update `data` silently
4. Polling pauses when `document.hidden` is `true` (tab not visible)
5. Polling stops when `stopWhen(data)` returns `true`
6. Errors during polling do NOT clear previous data
7. `lastUpdated` tracks the timestamp of the last successful fetch
8. Unit tests cover initial load, polling cycle, tab visibility, stop condition, and error resilience

## Tasks / Subtasks

- [x] Task 1: Create `hooks/usePolling.ts` (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] Create `hooks/` directory with `index.ts` barrel export
  - [x] Implement `usePolling<T>` generic hook with signature from architecture contract
  - [x] Accept `fetchFn: () => Promise<T>`, `intervalMs: number`, `options?: { enabled?: boolean; stopWhen?: (data: T) => boolean }`
  - [x] Return `{ data: T | null; loading: boolean; error: Error | null; lastUpdated: Date | null }`
  - [x] `loading` = `true` only during initial fetch; subsequent polls keep `loading` = `false`
  - [x] On successful fetch: update `data`, set `lastUpdated` to `new Date()`, clear `error`
  - [x] On poll error: set `error` but preserve previous `data` (do NOT clear it)
  - [x] Use `setInterval` for polling; clear interval on unmount via `useEffect` cleanup
  - [x] Check `document.hidden` before each poll tick — skip fetch if tab not visible
  - [x] Listen to `visibilitychange` event to resume polling when tab becomes visible again
  - [x] If `stopWhen(data)` returns `true` after a successful fetch, clear the interval (stop polling)
  - [x] If `enabled` is `false`, do not start polling (but still do the initial fetch if `enabled` is undefined/true)
  - [x] Add `@public` JSDoc tag and Alithya license header

- [x] Task 2: Create `hooks/usePolling.test.ts` (AC: #8)
  - [x] Test initial fetch sets `loading: true` then resolves with `data` and `loading: false`
  - [x] Test polling calls fetchFn at the specified interval
  - [x] Test polling updates `data` silently (loading stays false)
  - [x] Test `lastUpdated` updates on each successful fetch
  - [x] Test error during polling sets `error` but preserves previous `data`
  - [x] Test `stopWhen` returning `true` stops the polling interval
  - [x] Test `document.hidden = true` skips fetch during poll tick
  - [x] Test `visibilitychange` event resumes polling when tab becomes visible
  - [x] Test `enabled: false` prevents polling (no interval started)
  - [x] Test cleanup on unmount clears interval and event listener
  - [x] Test error on initial fetch sets `error` and `loading: false`

- [x] Task 3: Update `hooks/index.ts` — barrel export
  - [x] Export `usePolling` from `./usePolling`

- [x] Task 4: Update `src/index.ts` — export hook (AC: #1)
  - [x] Export `usePolling` from `./hooks`

- [x] Task 5: Verify build and tests (AC: all)
  - [x] Run `yarn backstage-cli package test --no-watch` — all tests must pass
  - [x] Run `yarn backstage-cli package build` — must succeed

## Dev Notes

### Architecture Contract (MUST follow exactly)

From architecture.md — the hook signature is:

```typescript
function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean; stopWhen?: (data: T) => boolean }
): { data: T | null; loading: boolean; error: Error | null; lastUpdated: Date | null }
```

Key rules:
- Pauses when browser tab not visible (`document.hidden`)
- Stops when `stopWhen` returns `true`
- Errors don't clear previous data
- `loading` is `true` only on initial fetch — polling refreshes are silent

### Implementation Pattern

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

/** @public */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean; stopWhen?: (data: T) => boolean },
): { data: T | null; loading: boolean; error: Error | null; lastUpdated: Date | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use refs for mutable values to avoid stale closures in setInterval
  const fetchFnRef = useRef(fetchFn);
  const stopWhenRef = useRef(options?.stopWhen);
  const dataRef = useRef<T | null>(null);
  // ... implementation
}
```

### Polling Lifecycle

1. On mount (or when `enabled` changes to `true`): execute initial fetch with `loading: true`
2. After initial fetch succeeds: set `data`, `lastUpdated`, `loading: false`, start interval
3. On each interval tick:
   - If `document.hidden` → skip this tick
   - Call `fetchFn()`
   - On success: update `data`, `lastUpdated` (keep `loading: false`)
   - On error: set `error`, keep previous `data` (keep `loading: false`)
   - If `stopWhen(newData)` returns `true` → clear interval
4. On `visibilitychange` event: if tab becomes visible, immediately trigger a fetch
5. On unmount: clear interval, remove `visibilitychange` listener

### Testing Pattern — React Hooks with Timers

Use `@testing-library/react` `renderHook` and `act` with Jest fake timers:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePolling } from './usePolling';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());
```

For `document.hidden` and `visibilitychange`:
```typescript
Object.defineProperty(document, 'hidden', { value: true, writable: true });
document.dispatchEvent(new Event('visibilitychange'));
```

For advancing timers inside `act`:
```typescript
await act(async () => {
  jest.advanceTimersByTime(30000);
});
```

### File Locations

- `plugins/argo-workflows/src/hooks/usePolling.ts` — NEW
- `plugins/argo-workflows/src/hooks/usePolling.test.ts` — NEW
- `plugins/argo-workflows/src/hooks/index.ts` — NEW
- `plugins/argo-workflows/src/index.ts` — UPDATE (add hook export)

### Naming Conventions (from architecture)

- Hooks: camelCase with `use` prefix, `.ts` extension
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_POLL_INTERVAL` if needed)
- Co-located test files (not `__tests__/` directory)

### Dependencies

All needed dependencies are already in `package.json`:
- `react` (peer dep) — `useState`, `useEffect`, `useRef`, `useCallback`
- `@testing-library/react` (dev dep) — `renderHook`, `act`, `waitFor`

Do NOT add any new dependencies.

### Previous Story Learnings

- License headers must be "The Alithya Authors" 2026
- Pre-existing ESLint conflict on frontend plugin — `yarn lint` may fail due to react plugin conflict between root `.eslintrc.cjs` and plugin `.eslintrc.js`
- Use `yarn backstage-cli package build` for build verification
- Use `yarn backstage-cli package test --no-watch` for running tests
- Input validation was added in Story 2.2 code review — follow same defensive pattern
- `@public` JSDoc tags required on all exported symbols

### What NOT to Do

- Do NOT add React components — this is a hook only
- Do NOT import from `@backstage/core-plugin-api` — this hook is framework-agnostic (pure React)
- Do NOT modify the common package
- Do NOT add new npm dependencies
- Do NOT create a `__tests__/` directory — tests are co-located
- Do NOT use `setTimeout` chains — use `setInterval` with cleanup
- Do NOT use `useReducer` — keep it simple with `useState`
- Do NOT make the hook Argo-specific — it's a generic polling utility

### References

- [Source: architecture.md#Polling hook contract] — exact signature and behavior
- [Source: architecture.md#Process Patterns] — loading state: initial only, silent polling
- [Source: architecture.md#State Management] — usePolling per-hook state
- [Source: epics.md#Story 2.3] — acceptance criteria
- [Source: architecture.md#Naming Conventions] — hooks use camelCase with `use` prefix

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Implemented generic `usePolling<T>` hook matching architecture contract exactly
- Hook uses `useState` + `useRef` + `useEffect` — no external dependencies
- `loading` is `true` only during initial fetch; polling refreshes are silent
- Errors during polling preserve previous `data` (never cleared)
- `stopWhen(data)` stops the interval after a successful fetch
- `document.hidden` check skips fetch on hidden tabs; `visibilitychange` triggers immediate fetch on tab focus
- `enabled: false` prevents both initial fetch and polling
- Cleanup on unmount clears interval and removes event listener
- 11 new tests pass, 30 total tests pass across frontend plugin
- Build succeeds with no errors
- No new dependencies added

### File List

workspaces/argo-workflows/plugins/argo-workflows/src/hooks/usePolling.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/usePolling.test.ts
workspaces/argo-workflows/plugins/argo-workflows/src/hooks/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/index.ts
