# Story 1.4: Backend Plugin Skeleton with Health Check

Status: done

## Story

As a platform engineer,
I want the `argo-workflows-backend` plugin registered with the Backstage backend system and exposing a `/health` endpoint,
so that I can verify the plugin is loaded and operational.

## Acceptance Criteria

1. `createBackendPlugin` is used with pluginId `'argo-workflows'`
2. The plugin registers an Express router via `coreServices.httpRouter`
3. `GET /health` returns `{ status: 'ok' }` with HTTP 200
4. The `/health` endpoint does NOT require Backstage authentication
5. The dev backend (`packages/backend/`) loads the plugin successfully
6. Unit tests verify the health endpoint response

## Tasks / Subtasks

- [x] Task 1: Update `plugin.ts` to use `httpRouter.addAuthPolicy` for unauthenticated `/health` (AC: #1, #2, #4)
  - [x] Add `httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' })` after `httpRouter.use()`
  - [x] Ensure `pluginId` remains `'argo-workflows'`
  - [x] Add `@public` JSDoc tag to the exported plugin
  - [x] Add Alithya license header

- [x] Task 2: Update `router.ts` with proper typing and license header (AC: #2, #3)
  - [x] Ensure `GET /health` returns `{ status: 'ok' }` with 200
  - [x] Ensure `RouterOptions` interface has `logger: LoggerService`
  - [x] Add `@public` JSDoc tags to `RouterOptions` and `createRouter`
  - [x] Add Alithya license header

- [x] Task 3: Update `index.ts` barrel export (AC: #1)
  - [x] Ensure default export is `argoWorkflowsPlugin` from `./plugin`
  - [x] Add `@packageDocumentation` JSDoc
  - [x] Add Alithya license header

- [x] Task 4: Create `router.test.ts` with health endpoint tests (AC: #6)
  - [x] Test `GET /health` returns HTTP 200
  - [x] Test `GET /health` returns `{ status: 'ok' }` JSON body
  - [x] Use `supertest` to test the Express router directly
  - [x] Mock the logger dependency

- [x] Task 5: Verify build and dev backend loading (AC: #5)
  - [x] Run `yarn build` for the backend plugin — must succeed
  - [x] Run `yarn lint` — must pass
  - [x] Run `yarn test` — all tests must pass
  - [x] Verify `packages/backend/src/index.ts` already imports the plugin (it does)

## Dev Notes

### Current State of Backend Plugin

The backend plugin already has a working skeleton from Story 1.1 with:
- `plugin.ts` — `createBackendPlugin` with `pluginId: 'argo-workflows'`, deps on `logger` and `httpRouter`
- `router.ts` — `createRouter` with `GET /health` returning `{ status: 'ok' }`
- `index.ts` — default export of `argoWorkflowsPlugin`

What's MISSING and needs to be added:
- `httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' })` — required so `/health` doesn't need Backstage auth
- Unit tests for the health endpoint
- Proper license headers (must be "The Alithya Authors" per lint rules)
- `@public` JSDoc tags on exports

### Plugin Registration Pattern (from reference plugins in repo)

Follow the pattern from `workspaces/changelog/plugins/changelog-backend/src/plugin.ts`:

```typescript
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/** @public */
export const argoWorkflowsPlugin = createBackendPlugin({
  pluginId: 'argo-workflows',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter }) {
        httpRouter.use(
          await createRouter({ logger }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
```

### Router Pattern

The router is already correct. Just needs license header and JSDoc tags:

```typescript
import { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';

/** @public */
export interface RouterOptions {
  logger: LoggerService;
}

/** @public */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;
  const router = Router();

  router.get('/health', (_, response) => {
    response.json({ status: 'ok' });
  });

  logger.info('Argo Workflows backend plugin initialized');
  return router;
}
```

### Testing Pattern

Use `supertest` to test the Express router directly. The backend package already has `supertest` and `@backstage/backend-test-utils` as devDependencies.

```typescript
import { createRouter } from './router';
import express from 'express';
import request from 'supertest';

// Create a mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};
```

### File Locations

- `plugins/argo-workflows-backend/src/plugin.ts` — update existing (add addAuthPolicy)
- `plugins/argo-workflows-backend/src/router.ts` — update existing (add license header + JSDoc)
- `plugins/argo-workflows-backend/src/index.ts` — update existing (add license header)
- `plugins/argo-workflows-backend/src/router.test.ts` — NEW file

### Dev Backend Loading

`packages/backend/src/index.ts` already loads the plugin:
```typescript
backend.add(import('@backstage-community/plugin-argo-workflows-backend'));
```
No changes needed to the dev backend.

### Dependencies Already Available

The `package.json` already has all needed dependencies:
- `@backstage/backend-plugin-api` — for `coreServices`, `createBackendPlugin`, `LoggerService`
- `express` and `express-promise-router` — for routing
- `supertest` (devDep) — for testing
- `@backstage/backend-test-utils` (devDep) — for test utilities

Do NOT add any new dependencies.

### License Header

All files must use "The Alithya Authors" (not "The Backstage Authors") per the repo's ESLint notice rule. Run `yarn lint --fix` if needed to auto-correct.

### Architecture Constraints

- New backend system ONLY — use `createBackendPlugin` with `coreServices`, NOT legacy `createRouter` pattern
- `/health` is the ONLY unauthenticated route — all future data routes (Story 2.1+) will require `httpAuth`
- The `httpAuth` service is NOT needed yet — it will be added in Story 2.1 when data routes are implemented
- Do NOT add `httpAuth` to deps in this story — keep it minimal

### Previous Story Learnings (from Story 1.3)

- License headers must be "The Alithya Authors" 2026 — run `yarn lint --fix` to auto-correct
- `yarn tsc --noEmit` conflicts with `emitDeclarationOnly` in tsconfig — use `yarn build` instead for type checking
- Tests run via `yarn backstage-cli package test --no-watch`

### What NOT to Do

- Do NOT add `httpAuth` or `auth` to plugin deps — not needed until Story 2.1
- Do NOT add `config` to plugin deps — not needed until Story 2.1
- Do NOT create `service/` or `mappers/` directories — those are for Story 2.1+
- Do NOT add any new npm dependencies
- Do NOT modify the dev backend `packages/backend/src/index.ts` — it already loads the plugin
- Do NOT create a `__tests__/` directory — tests are co-located

### Project Structure Notes

- All files in `workspaces/argo-workflows/plugins/argo-workflows-backend/src/`
- Test file co-located: `router.test.ts` next to `router.ts`
- No subdirectories needed for this story

### References

- [Source: architecture.md#Authentication & Security] — `/health` unauthenticated, all other routes require `httpAuth`
- [Source: architecture.md#API & Communication Patterns] — REST routes table showing `/health` returns `{ status: 'ok' }`
- [Source: architecture.md#Structure Patterns] — backend file structure
- [Source: architecture.md#Starter Template Evaluation] — new backend system only (`createBackendPlugin` with `coreServices`)
- [Source: epics.md#Story 1.4] — acceptance criteria and story statement
- [Source: workspaces/changelog/plugins/changelog-backend/src/plugin.ts] — reference pattern for `addAuthPolicy`
- [Source: workspaces/aws/plugins/amazon-ecs-backend/src/plugin.ts] — reference pattern for `addAuthPolicy`
- [Source: _bmad-output/implementation-artifacts/1-3-status-mapping-and-duration-utilities.md] — previous story learnings (license headers, build commands)

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Added `httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' })` to `plugin.ts` so `/health` doesn't require Backstage auth
- Created `router.test.ts` with 2 supertest tests verifying GET /health returns 200 and `{ status: 'ok' }`
- License headers auto-fixed to "The Alithya Authors" 2026 via `yarn lint --fix` on all 4 source files
- `index.ts` already had `@packageDocumentation` JSDoc — lint fix added license header
- All 2 tests pass, build succeeds, lint clean
- No new dependencies added — used existing `supertest` devDependency

### File List

workspaces/argo-workflows/plugins/argo-workflows-backend/src/plugin.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.test.ts
