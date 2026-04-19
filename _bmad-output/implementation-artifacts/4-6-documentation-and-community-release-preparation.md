# Story 4.6: Documentation and Community Release Preparation

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
| Low | 0 | — |

### Acceptance Criteria

All 8 ACs verified ✅

### Verdict

**APPROVED** — Comprehensive documentation covering installation, setup, RBAC, troubleshooting, and release preparation.

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a plugin consumer,
I want comprehensive README documentation with installation instructions, configuration examples, and screenshots,
so that I can set up the plugin in my Backstage instance.

## Acceptance Criteria

1. Each package (common, frontend, backend) has a README.md with installation instructions
2. The frontend README includes: `yarn add` command, `EntityPage.tsx` integration code, and `app-config.yaml` K8s custom resources configuration
3. The backend README includes: `yarn add` command, backend registration code, and RBAC requirements
4. Example `catalog-info.yaml` annotations are documented
5. A troubleshooting section covers: missing annotations, RBAC errors, cluster connectivity
6. `yarn build:api-reports` passes for all three packages with no diff
7. Changesets are created for the initial release
8. The workspace `README.md` provides an overview with links to each package

## Tasks / Subtasks

- [x] Task 1: Write workspace `README.md` (AC: #8)
  - [x] Rewrite `workspaces/argo-workflows/README.md` with:
    - Plugin overview and purpose
    - Links to each package README
    - Quick start section
    - Feature list (workflow list, DAG visualization, node inspection)
    - Screenshot placeholder (describe what the UI shows)

- [x] Task 2: Write frontend plugin `README.md` (AC: #1, #2, #4, #5)
  - [x] Rewrite `plugins/argo-workflows/README.md` with:
    - Installation: `yarn --cwd packages/app add @backstage-community/plugin-argo-workflows`
    - `EntityPage.tsx` integration code snippet
    - Entity annotations: `backstage.io/kubernetes-namespace`, `backstage.io/kubernetes-label-selector`
    - Example `catalog-info.yaml` with annotations
    - Troubleshooting: missing annotations, no workflows found, RBAC errors, cluster connectivity

- [x] Task 3: Write backend plugin `README.md` (AC: #1, #3)
  - [x] Rewrite `plugins/argo-workflows-backend/README.md` with:
    - Installation: `yarn --cwd packages/backend add @backstage-community/plugin-argo-workflows-backend`
    - Backend registration code snippet (`packages/backend/src/index.ts`)
    - `app-config.yaml` Kubernetes custom resources configuration
    - RBAC requirements: `get`, `list` on `workflows.argoproj.io`
    - API routes documentation

- [x] Task 4: Write common package `README.md` (AC: #1)
  - [x] Rewrite `plugins/argo-workflows-common/README.md` with:
    - Package purpose (shared types, utilities, API ref)
    - Installation (usually automatic as dependency)
    - Exported types and utilities list

- [x] Task 5: Run `yarn build:api-reports` and fix any diffs (AC: #6)
  - [x] Run `yarn backstage-cli package build` for all three packages
  - [x] Run `yarn build:api-reports` if available, or verify `report.api.md` files are up to date
  - [x] Fix any `@public` tag issues

- [x] Task 6: Create changesets for initial release (AC: #7)
  - [x] Create changeset file in `.changeset/` for each package:
    - `@backstage-community/plugin-argo-workflows-common` — minor (new package)
    - `@backstage-community/plugin-argo-workflows` — minor (new package)
    - `@backstage-community/plugin-argo-workflows-backend` — minor (new package)

- [x] Task 7: Verify build (AC: all)
  - [x] Run `yarn backstage-cli package build` for all three packages — succeeds

## Dev Notes

### Package Names

- Common: `@backstage-community/plugin-argo-workflows-common`
- Frontend: `@backstage-community/plugin-argo-workflows`
- Backend: `@backstage-community/plugin-argo-workflows-backend`

### Entity Annotations

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/kubernetes-namespace: production
    backstage.io/kubernetes-label-selector: app=my-service
```

### Backend Registration

```typescript
// packages/backend/src/index.ts
backend.add(import('@backstage-community/plugin-argo-workflows-backend'));
```

### EntityPage Integration

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import { EntityArgoWorkflowsContent } from '@backstage-community/plugin-argo-workflows';

// In the entity page layout:
<EntityLayout.Route path="/argo-workflows" title="Argo Workflows">
  <EntityArgoWorkflowsContent />
</EntityLayout.Route>
```

### K8s Custom Resources Config

```yaml
# app-config.yaml
kubernetes:
  customResources:
    - group: argoproj.io
      apiVersion: v1alpha1
      plural: workflows
```

### RBAC Requirements

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backstage-argo-workflows
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["workflows"]
    verbs: ["get", "list"]
```

### Changeset Format

```markdown
---
'@backstage-community/plugin-argo-workflows-common': minor
'@backstage-community/plugin-argo-workflows': minor
'@backstage-community/plugin-argo-workflows-backend': minor
---

Initial release of the Argo Workflows plugin for Backstage.
```

### What NOT to Do

- Do NOT add screenshots (no running instance available) — use text descriptions
- Do NOT modify source code — this is documentation only
- Do NOT create a CHANGELOG.md — changesets handle that automatically

### Project Structure Notes

```
workspaces/argo-workflows/
├── README.md                              ← REWRITE
├── .changeset/
│   └── initial-release.md                 ← NEW
├── plugins/
│   ├── argo-workflows/README.md           ← REWRITE
│   ├── argo-workflows-backend/README.md   ← REWRITE
│   └── argo-workflows-common/README.md    ← REWRITE
```

### References

- [Source: epics.md#Story 4.6] — Acceptance criteria
- [Source: architecture.md#API & Communication Patterns] — REST routes, API client
- [Source: argo-workflows-common/src/annotations.ts] — Annotation constants
- [Source: argo-workflows-backend/src/plugin.ts] — Backend plugin registration

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Rewrote workspace README with feature list, package links, quick start, entity annotations
- Rewrote frontend README with installation, EntityPage integration, annotations, troubleshooting (4 scenarios)
- Rewrote backend README with installation, registration, K8s config, RBAC, API routes
- Rewrote common README with exports list (types, utilities, constants)
- All three packages build successfully
- Created changeset for initial minor release of all three packages

### File List

workspaces/argo-workflows/README.md
workspaces/argo-workflows/plugins/argo-workflows/README.md
workspaces/argo-workflows/plugins/argo-workflows-backend/README.md
workspaces/argo-workflows/plugins/argo-workflows-common/README.md
workspaces/argo-workflows/.changeset/initial-release.md
