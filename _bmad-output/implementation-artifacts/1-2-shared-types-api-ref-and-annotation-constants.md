# Story 1.2: Shared Types, API Ref, and Annotation Constants

Status: done

## Story

As a plugin developer,
I want the `argo-workflows-common` package to export all shared TypeScript types, the API ref, and annotation constants,
so that both frontend and backend packages can import a single source of truth for types and configuration.

## Acceptance Criteria

1. `WorkflowSummary`, `WorkflowDetail`, `NodeStatus`, `NodeStatusSummary` interfaces are exported
2. `WorkflowPhase`, `NodePhase`, `NodeType` union types are exported
3. `argoWorkflowsApiRef` and `ArgoWorkflowsApi` interface are exported
4. `ARGO_WORKFLOWS_NAMESPACE_ANNOTATION`, `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION`, `ARGO_WORKFLOWS_CLUSTER_ANNOTATION` constants are exported
5. `yarn tsc` compiles without errors
6. `yarn build:all` succeeds
7. All exports use `@public` JSDoc tags

## Tasks / Subtasks

- [x] Task 1: Create types.ts with all shared interfaces and union types (AC: #1, #2, #7)
- [x] Task 2: Create api.ts with argoWorkflowsApiRef and ArgoWorkflowsApi interface (AC: #3, #7)
- [x] Task 3: Create annotations.ts with annotation constants (AC: #4, #7)
- [x] Task 4: Update index.ts to re-export everything (AC: #1-4)
- [x] Task 5: Verify build (AC: #5, #6)

## Dev Notes

### Type Definitions (from architecture.md)

All types defined exactly as specified in the architecture document's Data Architecture section. `NodeStatusSummary` is a lightweight version of `NodeStatus` containing only `phase` and `displayName` — used in `WorkflowSummary.nodes` for the NodeStatusDots table column.

### API Ref Pattern

Use `createApiRef` from `@backstage/core-plugin-api`. The API ref ID must be `plugin.argo-workflows.api`. The `ArgoWorkflowsApi` interface defines `listWorkflows` and `getWorkflow` methods.

### Annotation Constants

Use UPPER_SNAKE_CASE per architecture naming conventions. Values are the standard Backstage K8s annotation strings.

### References

- [Source: architecture.md#Data Architecture] — type definitions
- [Source: architecture.md#API & Communication Patterns] — API ref and interface
- [Source: architecture.md#Implementation Patterns] — naming conventions

## Dev Agent Record

### Agent Model Used

Auto (Kiro)

### Debug Log References

### Completion Notes List

- Created types.ts with all 8 type exports: WorkflowPhase, NodePhase, NodeType, NodeStatusSummary, NodeStatus, WorkflowSummary, WorkflowDetail
- Created api.ts with argoWorkflowsApiRef (id: plugin.argo-workflows.api) and ArgoWorkflowsApi interface (listWorkflows, getWorkflow)
- Created annotations.ts with 3 annotation constants
- Updated index.ts barrel export with all types, API ref, and annotations
- Added @backstage/core-plugin-api dependency to common package for createApiRef
- All exports have @public JSDoc tags and Apache 2.0 license headers
- yarn tsc clean, yarn build:all succeeds

### File List

workspaces/argo-workflows/plugins/argo-workflows-common/src/types.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/api.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/annotations.ts
workspaces/argo-workflows/plugins/argo-workflows-common/src/index.ts
workspaces/argo-workflows/plugins/argo-workflows-common/package.json
