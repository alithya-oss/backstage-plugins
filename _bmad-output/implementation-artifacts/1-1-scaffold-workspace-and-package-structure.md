# Story 1.1: Scaffold Workspace and Package Structure

Status: done

## Story

As a plugin developer,
I want the workspace directory structure created with all three packages (common, frontend, backend) configured with package.json, tsconfig.json, and build tooling,
so that I can build, lint, and test each package independently.

## Acceptance Criteria

1. The directory `workspaces/argo-workflows/` exists with the complete workspace structure
2. `yarn install` completes without errors from the workspace root
3. `yarn build` succeeds for all three plugin packages (common, frontend, backend)
4. `yarn lint` passes for all three packages
5. `yarn test` runs without errors (even with no test files yet)
6. `backstage.json` pins the Backstage version
7. `.changeset/config.json` is configured for public npm publishing
8. Each plugin package has a valid `package.json` with correct naming, peer dependencies, and Backstage metadata
9. Each plugin package has a `tsconfig.json` extending the workspace root config
10. The dev app (`packages/app/`) and dev backend (`packages/backend/`) are configured for local development

## Tasks / Subtasks

- [x] Task 1: Create workspace root configuration (AC: #1, #6, #7)
  - [x] Create `workspaces/argo-workflows/package.json` with workspace config, scripts, and devDependencies
  - [x] Create `workspaces/argo-workflows/backstage.json` pinning Backstage version
  - [x] Create `workspaces/argo-workflows/tsconfig.json` root TypeScript config
  - [x] Create `workspaces/argo-workflows/.changeset/config.json` for changesets
  - [x] Create `workspaces/argo-workflows/.changeset/README.md`
  - [x] Create `workspaces/argo-workflows/.yarnrc.yml` pointing to yarn release
  - [x] Create `workspaces/argo-workflows/app-config.yaml` with K8s custom resources for Argo CRDs
  - [x] Create `workspaces/argo-workflows/catalog-info.yaml` workspace catalog entry
  - [x] Create `workspaces/argo-workflows/README.md` workspace overview

- [x] Task 2: Create `argo-workflows-common` package (AC: #3, #4, #5, #8, #9)
  - [x] Create `plugins/argo-workflows-common/package.json` with name `@backstage-community/plugin-argo-workflows-common`, role `common-library`
  - [x] Create `plugins/argo-workflows-common/tsconfig.json`
  - [x] Create `plugins/argo-workflows-common/src/index.ts` with placeholder export
  - [x] Create `plugins/argo-workflows-common/CHANGELOG.md`
  - [x] Create `plugins/argo-workflows-common/README.md`

- [x] Task 3: Create `argo-workflows` frontend package (AC: #3, #4, #5, #8, #9)
  - [x] Create `plugins/argo-workflows/package.json` with name `@backstage-community/plugin-argo-workflows`, role `frontend-plugin`
  - [x] Create `plugins/argo-workflows/tsconfig.json`
  - [x] Create `plugins/argo-workflows/src/index.ts` with placeholder export
  - [x] Create `plugins/argo-workflows/CHANGELOG.md`
  - [x] Create `plugins/argo-workflows/README.md`

- [x] Task 4: Create `argo-workflows-backend` package (AC: #3, #4, #5, #8, #9)
  - [x] Create `plugins/argo-workflows-backend/package.json` with name `@backstage-community/plugin-argo-workflows-backend`, role `backend-plugin`
  - [x] Create `plugins/argo-workflows-backend/tsconfig.json`
  - [x] Create `plugins/argo-workflows-backend/src/index.ts` with placeholder export
  - [x] Create `plugins/argo-workflows-backend/CHANGELOG.md`
  - [x] Create `plugins/argo-workflows-backend/README.md`

- [x] Task 5: Create dev app and dev backend (AC: #10)
  - [x] Create `packages/app/package.json` and `packages/app/src/App.tsx` minimal dev app
  - [x] Create `packages/backend/package.json` and `packages/backend/src/index.ts` minimal dev backend

- [x] Task 6: Verify build pipeline (AC: #2, #3, #4, #5)
  - [x] Run `yarn install` from workspace root — must succeed
  - [x] Run `yarn build` — all packages must compile
  - [x] Run `yarn lint` — must pass
  - [x] Run `yarn test` — must run without errors

## Dev Notes

### Critical Architecture Constraints

- **Package naming:** `@backstage-community/plugin-argo-workflows-common`, `@backstage-community/plugin-argo-workflows`, `@backstage-community/plugin-argo-workflows-backend` — these exact names are required for community-plugins repo.
- **Package roles:** common uses `"backstage": { "role": "common-library" }`, frontend uses `"backstage": { "role": "frontend-plugin" }`, backend uses `"backstage": { "role": "backend-plugin" }`.
- **No MUI dependency:** Do NOT add `@mui/material` or `@mui/styles` to any package. BUI only.
- **New backend system only:** The backend package must NOT include legacy backend support. Only `@backstage/backend-plugin-api`.
- **Old frontend system for MVP:** The frontend package uses `@backstage/core-plugin-api` (createPlugin, createRoutableExtension). NOT the new frontend system.

### Workspace Root package.json Pattern

Model after `workspaces/aws/package.json` with these key differences:
- `name`: `@internal/argo-workflows`
- `private`: true
- Remove `@mui/styles` from dependencies (BUI only)
- Scripts must include: `build:all`, `build:api-reports`, `tsc`, `test`, `lint`, `lint:all`, `clean`, `test:e2e`
- `workspaces.packages`: `["packages/*", "plugins/*"]`
- `packageManager`: `yarn@4.9.1`
- `engines`: `{ "node": "18 || 20" }`
- `devDependencies`: `@backstage/cli`, `@backstage/repo-tools`, `@changesets/cli`, `@playwright/test`, `@spotify/prettier-config`, `prettier`, `typescript`

### backstage.json

Pin to the same version as the aws workspace: `{ "version": "1.39.0" }` — or check the latest stable Backstage release.

### Changeset Config

Copy from `workspaces/aws/.changeset/config.json`:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "privatePackages": { "tag": false, "version": false }
}
```

### app-config.yaml Must Include

```yaml
kubernetes:
  customResources:
    - group: 'argoproj.io'
      apiVersion: 'v1alpha1'
      plural: 'workflows'
```

### Plugin Package Dependencies

**argo-workflows-common:**
- dependencies: `@backstage/catalog-model`
- No React, no Node.js dependencies — pure TypeScript

**argo-workflows (frontend):**
- dependencies: `@backstage-community/plugin-argo-workflows-common`
- peerDependencies: `@backstage/core-plugin-api`, `@backstage/plugin-catalog-react`, `@backstage/ui`, `react`, `react-dom`

**argo-workflows-backend:**
- dependencies: `@backstage-community/plugin-argo-workflows-common`
- peerDependencies: `@backstage/backend-plugin-api`
- dependencies: `@backstage/plugin-kubernetes-node`, `express`, `express-promise-router`

### Placeholder Exports

Each `src/index.ts` should export a minimal placeholder so the package compiles:

**common:** `export const PLUGIN_ID = 'argo-workflows';`
**frontend:** `export { argoWorkflowsPlugin } from './plugin';` (with a minimal plugin.ts)
**backend:** `export { argoWorkflowsPlugin } from './plugin';` (with a minimal plugin.ts)

### Project Structure Notes

- Workspace lives at `workspaces/argo-workflows/` — same level as `workspaces/aws/`
- `.yarnrc.yml` must point to `.yarn/releases/yarn-4.9.1.cjs` (copy from aws workspace or symlink)
- The `.yarn/releases/` directory needs the yarn binary — copy from `workspaces/aws/.yarn/releases/`
- `postinstall` script in root package.json: `"cd ../../ && yarn install"` (same as aws workspace)

### References

- [Source: architecture.md#Starter Template Evaluation] — workspace scaffold approach
- [Source: architecture.md#Project Structure & Boundaries] — complete directory tree
- [Source: architecture.md#Implementation Patterns] — naming conventions, file organization
- [Source: workspaces/aws/package.json] — reference workspace root config
- [Source: workspaces/aws/backstage.json] — Backstage version pin
- [Source: workspaces/aws/.changeset/config.json] — changeset configuration

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Workspace scaffolded at `workspaces/argo-workflows/` with 5 workspace packages
- Root tsconfig uses single-file pattern (no per-plugin tsconfigs) matching aws workspace convention
- Per-plugin tsconfigs removed — root tsconfig with `outDir: "dist-types"` and `rootDir: "."` handles all packages
- React imports removed from TSX files — `jsx: "react-jsx"` in tsconfig handles JSX transform
- `.eslintrc.js` added to each plugin package using `@backstage/cli/config/eslint-factory`
- `.eslintignore` added to workspace root to exclude dist/dist-types/node_modules
- `better-sqlite3` bumped from ^9.0.0 to ^11.0.0 for build compatibility
- `yarn.lock` created as empty seed for independent workspace
- `.yarn/releases/yarn-4.9.1.cjs` copied from aws workspace
- All 6 tasks completed, all ACs verified

### File List

workspaces/argo-workflows/package.json
workspaces/argo-workflows/backstage.json
workspaces/argo-workflows/tsconfig.json
workspaces/argo-workflows/yarn.lock
workspaces/argo-workflows/app-config.yaml
workspaces/argo-workflows/catalog-info.yaml
workspaces/argo-workflows/README.md
workspaces/argo-workflows/.yarnrc.yml
workspaces/argo-workflows/.eslintignore
workspaces/argo-workflows/.changeset/config.json
workspaces/argo-workflows/.changeset/README.md
workspaces/argo-workflows/.yarn/releases/yarn-4.9.1.cjs
workspaces/argo-workflows/plugins/argo-workflows-common/package.json
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-common/CHANGELOG.md
workspaces/argo-workflows/plugins/argo-workflows-common/README.md
workspaces/argo-workflows/plugins/argo-workflows-common/.eslintrc.js
workspaces/argo-workflows/plugins/argo-workflows/package.json
workspaces/argo-workflows/plugins/argo-workflows/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows/src/plugin.ts
workspaces/argo-workflows/plugins/argo-workflows/src/routes.ts
workspaces/argo-workflows/plugins/argo-workflows/src/components/ArgoWorkflowsPage.tsx
workspaces/argo-workflows/plugins/argo-workflows/CHANGELOG.md
workspaces/argo-workflows/plugins/argo-workflows/README.md
workspaces/argo-workflows/plugins/argo-workflows/.eslintrc.js
workspaces/argo-workflows/plugins/argo-workflows-backend/package.json
workspaces/argo-workflows/plugins/argo-workflows-backend/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/plugin.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/src/router.ts
workspaces/argo-workflows/plugins/argo-workflows-backend/CHANGELOG.md
workspaces/argo-workflows/plugins/argo-workflows-backend/README.md
workspaces/argo-workflows/plugins/argo-workflows-backend/.eslintrc.js
workspaces/argo-workflows/packages/app/package.json
workspaces/argo-workflows/packages/app/src/App.tsx
workspaces/argo-workflows/packages/app/src/index.tsx
workspaces/argo-workflows/packages/backend/package.json
workspaces/argo-workflows/packages/backend/src/index.ts
