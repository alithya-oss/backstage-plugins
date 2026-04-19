---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/research/technical-argo-workflows-backstage-plugin-research-2026-04-18.md'
workflowType: 'architecture'
project_name: 'backstage-plugins'
user_name: 'Fjudith'
date: '2026-04-18'
lastStep: 8
status: 'complete'
completedAt: '2026-04-18'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._


## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

31 functional requirements across 6 categories:

| Category | FRs | Architectural Implication |
|----------|-----|--------------------------|
| Workflow Discovery & Browsing (FR1–FR5) | List, filter, sort, paginate, search workflows | BUI Table with `useTable` hook, backend list endpoint with query params |
| Workflow Detail & DAG Visualization (FR6–FR11) | Workflow metadata, interactive DAG, status indicators, zoom/pan/minimap, node type distinction | Custom DAGCardFlow component, horizontal flexbox layout, status mapping utility |
| Node Inspection (FR12–FR15) | Click node for detail, phase/timing/message display, blast radius visibility | NodeDetailPanel component, side panel interaction pattern |
| Entity Integration (FR16–FR20) | Entity annotations, namespace/label-selector config, entity page tab, empty states | Annotation resolution utility, `EntityArgoWorkflowsContent` routable extension |
| Backend & Data Access (FR21–FR25) | K8s CRD fetching, single workflow detail, REST routes, Backstage auth, no Argo Server dependency | Backend plugin using `@backstage/plugin-kubernetes-node`, REST router with auth middleware |
| Visual Consistency & Theming (FR26–FR28) | BUI design system, light/dark themes, status color mapping | BUI tokens only, zero MUI, shared phase-to-status mapping |

**Non-Functional Requirements:**

| NFR | Target | Architectural Impact |
|-----|--------|---------------------|
| Workflow list render | < 2s for 100 workflows | Backend pagination, efficient K8s API queries with label selectors |
| DAG render | < 1s for 50 nodes | Client-side topological sort + CSS flexbox layout (no heavy graph library for MVP) |
| DAG interactivity | No perceptible lag for 100 nodes | Lightweight card components, no React Flow overhead in MVP |
| Polling | 30s list / 5s running detail / stop on terminal | Polling hook with state-aware interval management |
| Security | Backstage auth on all routes, entity-scoped data | `httpAuth` from `coreServices`, namespace isolation via annotations |
| Accessibility | WCAG 2.1 AA | React Aria for custom interactive elements, BUI built-in a11y |
| Reliability | Graceful K8s API error handling | Error boundaries, typed error states, fallback metadata view |

### Technical Constraints & Dependencies

**Platform constraints:**
- Must follow Backstage community-plugins repository structure and conventions
- Must pass `yarn build:api-reports` with `@public` JSDoc tags
- Must use changesets for versioning
- Must support old frontend system (`createPlugin`/`createRoutableExtension`) for MVP
- Must use new backend system only (`createBackendPlugin` with `coreServices`)
- BUI-only — no Material UI imports

**Key dependencies:**
- `@backstage/core-plugin-api` — frontend plugin registration, API factories
- `@backstage/backend-plugin-api` — backend plugin registration, core services
- `@backstage/plugin-kubernetes-node` — K8s API access from backend
- `@backstage/plugin-kubernetes-react` — `kubernetesApiRef` for frontend (if needed)
- `@backstage/plugin-catalog-react` — entity context, annotation utilities
- `@backstage/ui` — BUI component library

**No external graph library for MVP:** The UX spec's Direction F uses a horizontal CSS flexbox card flow — not React Flow or elkjs. This eliminates ~150KB of bundle size and simplifies the architecture. React Flow is reserved for a potential future full-page DAG view for very large workflows.

### Cross-Cutting Concerns Identified

1. **Status mapping** — The Argo phase → BUI status token mapping is used in 4 places: table Badge, NodeStatusDots, DAGNodeCard border/icon, and NodeDetailPanel. Must be a single shared utility in `argo-workflows-common`.

2. **Entity annotation resolution** — Reading `backstage.io/kubernetes-namespace`, `backstage.io/kubernetes-label-selector`, and optional `argoworkflows.io/*` annotations. Used by both the frontend (to display context) and backend (to scope K8s queries). Shared annotation constants in `argo-workflows-common`.

3. **Polling lifecycle** — Three polling states (list at 30s, running detail at 5s, terminal = stopped). Must not cause layout shifts, must not collapse expanded rows, must pause when tab is not visible. Needs a shared polling hook.

4. **Error handling** — K8s API errors (403, 404, timeout, 500) must be caught and displayed as specific, actionable BUI Alert messages. Error classification logic shared between backend (HTTP status mapping) and frontend (error display).

5. **Authentication** — All backend routes require Backstage `httpAuth` except `/health`. The frontend API client must pass credentials via the Backstage `fetchApi`.


## Starter Template Evaluation

### Primary Technology Domain

Backstage community plugin — the technology stack is entirely dictated by the Backstage ecosystem. No starter template selection needed.

### Selected Approach: Manual Workspace Scaffold

**Rationale:** This is a Backstage community plugin that must conform to the `backstage/community-plugins` repository structure. The "starter" is the workspace directory scaffold following the pattern established by existing plugins (Tekton, AWS) in this repository. No CLI generator or external starter template applies.

**Initialization:** Create the workspace directory structure manually, modeled after `workspaces/aws/` and the Tekton community plugin.

### Architectural Decisions Provided by Platform

**Language & Runtime:** TypeScript (strict) on Node.js. Non-negotiable for Backstage plugins.

**Frontend Framework:** React 18 with Backstage UI (BUI). No MUI.

**Backend Framework:** Express via Backstage new backend system (`createBackendPlugin` with `coreServices`).

**Build Tooling:** `@backstage/cli` — handles build, type-check, lint, test, and API report generation.

**Testing Framework:** Jest + React Testing Library (unit/integration), Playwright (E2E).

**Linting/Formatting:** ESLint + Prettier — configs already exist in this workspace.

**Package Management:** Yarn 4 with workspaces. Already configured (`.yarn/releases/yarn-4.9.1.cjs`).

**Versioning:** Changesets — standard for community-plugins repo.

**Project Structure:**

```
workspaces/argo-workflows/
├── .changeset/
├── packages/
│   ├── app/                          # Dev app for local testing
│   └── backend/                      # Dev backend for local testing
├── plugins/
│   ├── argo-workflows-common/        # Shared types, API refs, annotations
│   ├── argo-workflows/               # Frontend plugin (React, BUI, DAG view)
│   └── argo-workflows-backend/       # Backend plugin (K8s proxy routes)
├── app-config.yaml
├── package.json
├── tsconfig.json
└── backstage.json
```

**Note:** The `argo-workflows-react` package (reusable hooks for third-party plugins) is Phase 2 scope.


## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Backend CRD transformation strategy
2. Frontend-to-backend communication pattern
3. DAG layout algorithm placement
4. Frontend state management approach

**Deferred Decisions (Post-MVP):**
- Argo Server API integration strategy (Phase 3)
- Backstage permission framework integration (Phase 3)
- New frontend system support — `EntityContentBlueprint` (Phase 2)
- `argo-workflows-react` package API surface (Phase 2)
- Compressed nodes decompression strategy (Phase 2)

### Data Architecture

**Decision: Backend transforms CRD to typed API response**

The `argo-workflows-backend` plugin fetches raw Argo Workflow CRDs from the Kubernetes API via `@backstage/plugin-kubernetes-node` and transforms them into clean, typed response objects before sending to the frontend.

**Rationale:**
- The raw Argo Workflow CRD is large and version-variable. Fields may be missing or structured differently across Argo versions.
- The frontend only needs a subset of the CRD: metadata (name, namespace, labels, creationTimestamp), status (phase, startedAt, finishedAt), and status.nodes (for DAG rendering).
- Backend transformation insulates the frontend from CRD schema changes — if Argo changes a field name, only the backend mapper needs updating.
- Typed response objects in `argo-workflows-common` provide compile-time safety for both backend and frontend.

**Response types (defined in `argo-workflows-common`):**

```typescript
// Workflow list item (lightweight, no status.nodes)
interface WorkflowSummary {
  name: string;
  namespace: string;
  phase: WorkflowPhase;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  labels?: Record<string, string>;
  nodes: NodeStatusSummary[]; // phase + displayName only, for NodeStatusDots
}

// Workflow detail (full, includes status.nodes for DAG)
interface WorkflowDetail extends WorkflowSummary {
  nodes: NodeStatus[]; // full node data for DAG rendering
}

// Node status for DAG rendering
interface NodeStatus {
  id: string;
  displayName: string;
  type: NodeType;
  phase: NodePhase;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  message?: string;
  templateName?: string;
  children?: string[];
  outboundNodes?: string[];
  boundaryID?: string;
}

type WorkflowPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Error';
type NodePhase = 'Pending' | 'Running' | 'Succeeded' | 'Skipped' | 'Failed' | 'Error' | 'Omitted';
type NodeType = 'Pod' | 'DAG' | 'Steps' | 'StepGroup' | 'Retry' | 'Suspend' | 'HTTP' | 'Skipped' | 'TaskGroup';
```

**Data flow:**

```
K8s API (raw CRD) → Backend transformer → Typed response → Frontend API client → React components
```

**Caching:** No server-side caching for MVP. The K8s API is the source of truth. Frontend polling handles freshness. Caching can be added in Phase 2 if K8s API latency becomes an issue.

### Authentication & Security

**Decision: Backstage-native authentication on all routes**

All decisions are platform-dictated:

| Concern | Decision | Implementation |
|---------|----------|---------------|
| Route authentication | Backstage `httpAuth` from `coreServices` | All routes except `/health` require valid Backstage credentials |
| Frontend API calls | Backstage `fetchApi` | Automatically includes Backstage auth headers |
| K8s API access | Backstage K8s plugin service account | Inherits RBAC from the K8s plugin's configured service account |
| Entity-scoped data | Namespace isolation via annotations | Backend only queries the namespace specified in entity annotations — no cross-entity data access |
| No secrets in frontend | Backend-only K8s access | Frontend never sees K8s tokens or credentials |

**No additional security decisions needed for MVP.** The Backstage platform handles auth end-to-end.

### API & Communication Patterns

**Decision: Frontend calls `argo-workflows-backend` REST routes**

The frontend API client (`argoWorkflowsApiRef`) calls the backend plugin's REST endpoints. The frontend does not interact with the K8s API directly.

**Backend REST routes:**

| Route | Method | Request | Response | Purpose |
|-------|--------|---------|----------|---------|
| `/health` | GET | — | `{ status: 'ok' }` | Health check (unauthenticated) |
| `/workflows/:namespace` | GET | `?labelSelector=...&limit=...&offset=...` | `WorkflowSummary[]` | List workflows for entity |
| `/workflows/:namespace/:name` | GET | — | `WorkflowDetail` | Single workflow with full status.nodes |

**Frontend API client:**

```typescript
// Defined in argo-workflows-common
export const argoWorkflowsApiRef = createApiRef<ArgoWorkflowsApi>({
  id: 'plugin.argo-workflows.api',
});

export interface ArgoWorkflowsApi {
  listWorkflows(namespace: string, labelSelector?: string): Promise<WorkflowSummary[]>;
  getWorkflow(namespace: string, name: string): Promise<WorkflowDetail>;
}
```

**API factory registration:**

```typescript
createApiFactory({
  api: argoWorkflowsApiRef,
  deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
  factory: ({ discoveryApi, fetchApi }) =>
    new ArgoWorkflowsApiClient({ discoveryApi, fetchApi }),
});
```

**Error handling pattern:** Backend catches K8s API errors and returns typed error responses. Frontend API client maps HTTP status codes to specific error types displayed as BUI Alerts.

| K8s Error | Backend HTTP | Frontend Display |
|-----------|-------------|-----------------|
| 403 Forbidden | 403 | "Access denied. Check service account RBAC permissions." |
| 404 Not Found | 404 | "Namespace not found. Check entity annotations." |
| Timeout | 504 | "Kubernetes API timeout. Retrying..." |
| 500 Internal | 502 | "Unable to connect to cluster. Check K8s plugin configuration." |

### Frontend Architecture

**Decision: React hooks + context only — no external state library**

| State | Managed By | Scope |
|-------|-----------|-------|
| Workflow list data | `useArgoWorkflows(entity)` hook | Component tree |
| Expanded row ID | `useState` in WorkflowTable | Component |
| Selected node ID | `useState` in expanded row | Component |
| Workflow detail data | `useWorkflowDetail(namespace, name)` hook | Expanded row |
| Polling interval | Custom `usePolling` hook | Per-hook |
| Filter state | `useState` in WorkflowTable | Component |

**Hook architecture:**

```typescript
// Fetches workflow list, handles polling
function useArgoWorkflows(entity: Entity): {
  workflows: WorkflowSummary[];
  loading: boolean;
  error: Error | null;
}

// Fetches single workflow detail with status.nodes, handles polling
function useWorkflowDetail(namespace: string, name: string): {
  workflow: WorkflowDetail | null;
  loading: boolean;
  error: Error | null;
}
```

**Rationale:** The state graph is flat and simple. One list, one expanded item, one selected node. No cross-component state sharing beyond parent-child props. React's built-in state management is sufficient and avoids adding a dependency.

### DAG Layout Algorithm

**Decision: Client-side topological sort in `argo-workflows-common`**

A pure function that transforms the `status.nodes` map into an ordered array of columns for the horizontal DAG card flow.

```typescript
// Input: flat map of node IDs to NodeStatus
// Output: ordered columns for horizontal rendering
function computeDAGColumns(nodes: NodeStatus[]): DAGColumn[];

interface DAGColumn {
  nodes: NodeStatus[];  // parallel nodes in this column
  isParallel: boolean;  // true if column has >1 node
}
```

**Algorithm:**
1. Build adjacency list from `children` arrays
2. Topological sort using Kahn's algorithm (BFS with in-degree tracking)
3. Group nodes into columns by topological level (nodes at the same level execute in parallel)
4. Filter out boundary nodes (type DAG/Steps/StepGroup) — these are structural, not execution nodes
5. Return ordered columns left-to-right

**Rationale:**
- Pure function with no side effects — easily unit testable
- Lives in `argo-workflows-common` so it can be reused by `argo-workflows-react` in Phase 2
- No external library needed — Kahn's algorithm is ~30 lines of TypeScript
- Handles the MVP case (flat DAGs, simple parallel branches). Nested DAG/Steps decompression is Phase 2.

### Decision Impact Analysis

**Implementation sequence:**
1. `argo-workflows-common` — types, API ref, annotations, status mapping, DAG layout algorithm
2. `argo-workflows-backend` — K8s CRD fetching, transformation, REST routes
3. `argo-workflows` (frontend) — API client, hooks, table, expandable row, DAG card flow, node panel

**Cross-component dependencies:**

```
argo-workflows-common (types, utils)
    ↑                    ↑
    |                    |
argo-workflows      argo-workflows-backend
(frontend)          (backend)
```

Both frontend and backend depend on `common` for types and utilities. Frontend and backend have no direct dependency on each other — they communicate over HTTP.


## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**5 critical conflict areas** where AI agents could make different choices, each with explicit rules below.

### Naming Patterns

**File Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase `.tsx` | `WorkflowTable.tsx`, `DAGCardFlow.tsx`, `NodeDetailPanel.tsx` |
| Hooks | camelCase with `use` prefix `.ts` | `useArgoWorkflows.ts`, `useWorkflowDetail.ts`, `usePolling.ts` |
| Utilities | camelCase `.ts` | `statusMapping.ts`, `computeDAGColumns.ts`, `annotations.ts` |
| Types | camelCase `.ts` | `types.ts` (per package), or `workflow.ts` if splitting |
| Tests | Same name + `.test.ts(x)` co-located | `WorkflowTable.test.tsx`, `computeDAGColumns.test.ts` |
| CSS modules (if needed) | Same name + `.module.css` co-located | `DAGNodeCard.module.css` |
| Index files | `index.ts` for public API barrel exports | `src/index.ts` |

**TypeScript Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| Interfaces | PascalCase, no `I` prefix | `WorkflowSummary`, `NodeStatus`, `ArgoWorkflowsApi` |
| Type aliases | PascalCase | `WorkflowPhase`, `NodePhase`, `NodeType` |
| Enums | Not used — use union types | `type WorkflowPhase = 'Pending' \| 'Running' \| ...` |
| Constants | UPPER_SNAKE_CASE | `ARGO_WORKFLOWS_ANNOTATION`, `DEFAULT_POLL_INTERVAL` |
| Functions | camelCase | `computeDAGColumns`, `mapCrdToWorkflowSummary` |
| React components | PascalCase | `WorkflowTable`, `DAGNodeCard` |
| Hook return values | Object destructuring, not arrays | `{ workflows, loading, error }` not `[workflows, loading, error]` |

**API Naming:**

| Element | Convention | Example |
|---------|-----------|---------|
| REST endpoints | Plural nouns, kebab-case | `/workflows/:namespace`, `/workflows/:namespace/:name` |
| Query parameters | camelCase | `?labelSelector=...&limit=20&offset=0` |
| JSON response fields | camelCase | `{ startedAt, finishedAt, displayName }` |
| API ref ID | Dot-separated plugin namespace | `plugin.argo-workflows.api` |

**Annotation Constants:**

```typescript
// In argo-workflows-common/src/annotations.ts
export const ARGO_WORKFLOWS_NAMESPACE_ANNOTATION = 'backstage.io/kubernetes-namespace';
export const ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION = 'backstage.io/kubernetes-label-selector';
export const ARGO_WORKFLOWS_CLUSTER_ANNOTATION = 'argoworkflows.io/cluster-name';
```

### Structure Patterns

**Component file organization — co-located by feature:**

```
plugins/argo-workflows/src/
├── api/
│   ├── ArgoWorkflowsApiClient.ts
│   ├── ArgoWorkflowsApiClient.test.ts
│   └── index.ts
├── components/
│   ├── WorkflowTable/
│   │   ├── WorkflowTable.tsx
│   │   ├── WorkflowTable.test.tsx
│   │   ├── WorkflowExpandableRow.tsx
│   │   ├── WorkflowExpandableRow.test.tsx
│   │   ├── NodeStatusDots.tsx
│   │   ├── NodeStatusDots.test.tsx
│   │   └── index.ts
│   ├── DAGCardFlow/
│   │   ├── DAGCardFlow.tsx
│   │   ├── DAGCardFlow.test.tsx
│   │   ├── DAGNodeCard.tsx
│   │   ├── DAGNodeCard.test.tsx
│   │   ├── DAGArrow.tsx
│   │   └── index.ts
│   ├── NodeDetailPanel/
│   │   ├── NodeDetailPanel.tsx
│   │   ├── NodeDetailPanel.test.tsx
│   │   └── index.ts
│   ├── EmptyState/
│   │   ├── WorkflowEmptyState.tsx
│   │   └── index.ts
│   └── Router.tsx
├── hooks/
│   ├── useArgoWorkflows.ts
│   ├── useArgoWorkflows.test.ts
│   ├── useWorkflowDetail.ts
│   ├── useWorkflowDetail.test.ts
│   ├── usePolling.ts
│   ├── usePolling.test.ts
│   └── index.ts
├── plugin.ts
├── routes.ts
└── index.ts
```

**Backend structure:**

```
plugins/argo-workflows-backend/src/
├── router.ts
├── router.test.ts
├── plugin.ts
├── service/
│   ├── ArgoWorkflowsService.ts
│   ├── ArgoWorkflowsService.test.ts
│   └── index.ts
├── mappers/
│   ├── workflowMapper.ts
│   ├── workflowMapper.test.ts
│   └── index.ts
└── index.ts
```

**Common package structure:**

```
plugins/argo-workflows-common/src/
├── types.ts
├── annotations.ts
├── statusMapping.ts
├── statusMapping.test.ts
├── computeDAGColumns.ts
├── computeDAGColumns.test.ts
├── api.ts
└── index.ts
```

**Rules:**
- Tests are always co-located — never in a separate `__tests__/` directory
- Each component folder has an `index.ts` barrel export
- Hooks live in `hooks/` directory, not inside component folders
- `api/` contains only the API client
- `plugin.ts` and `routes.ts` are top-level

### Format Patterns

**API response format — direct response, no wrapper:**

```typescript
// ✅ GET /workflows/production → direct array
[{ "name": "pipeline-abc", "phase": "Succeeded", ... }]

// ✅ GET /workflows/production/pipeline-abc → direct object
{ "name": "pipeline-abc", "phase": "Failed", "nodes": [...] }
```

**Error response format:**

```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
}
```

**Date/time:** ISO 8601 strings in API (`2026-04-18T14:22:54Z`). Frontend formats for display.

**Duration:** Seconds (number) in API. Frontend formats (`3m 47s`).

### Communication Patterns

**Status mapping — single source of truth in `argo-workflows-common/statusMapping.ts`:**

```typescript
export const PHASE_STATUS_MAP: Record<NodePhase, BUIStatus> = {
  Succeeded: 'success', Failed: 'danger', Error: 'danger',
  Running: 'info', Pending: 'warning', Skipped: 'secondary', Omitted: 'secondary',
};

export const PHASE_ICON_MAP: Record<NodePhase, string> = {
  Succeeded: '✓', Failed: '✗', Error: '⚠',
  Running: '◌', Pending: '○', Skipped: '⊘', Omitted: '—',
};
```

**Rule:** No component may define its own phase-to-color or phase-to-icon mapping.

**Polling hook contract:**

```typescript
function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalMs: number,
  options?: { enabled?: boolean; stopWhen?: (data: T) => boolean }
): { data: T | null; loading: boolean; error: Error | null; lastUpdated: Date | null }
```

- Pauses when browser tab not visible
- Stops when `stopWhen` returns true
- Errors don't clear previous data

### Process Patterns

**Error handling — three layers:**

| Layer | Responsibility |
|-------|---------------|
| Backend route | Catch K8s errors → typed `ErrorResponse` |
| Frontend API client | Catch HTTP errors → throw `ArgoWorkflowsError` |
| React component | Display error as BUI Alert |

**Loading state — initial only, silent polling:**

```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;  // true on initial fetch only
  error: Error | null;
}
```

Polling refreshes update `data` silently — `loading` stays `false`.

**Import pattern:**

```typescript
// ✅ Always use package name
import { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';

// ❌ Never use relative paths across packages
```

### Enforcement Guidelines

**All AI agents MUST:**

1. Import status mapping from `argo-workflows-common/statusMapping.ts` — never define local maps
2. Co-locate tests with source files — never create separate test directories
3. Use `ErrorResponse` format for all backend errors — never return plain strings
4. Return `{ data, loading, error }` from all hooks — never vary the shape
5. Use ISO 8601 for dates in API — never use timestamps or formatted strings
6. Use camelCase for JSON fields — never use snake_case
7. Import across packages using `@backstage-community/plugin-argo-workflows-*` — never relative paths


## Project Structure & Boundaries

### Complete Project Directory Structure

```
workspaces/argo-workflows/
├── .changeset/
│   ├── README.md
│   └── config.json
├── packages/
│   ├── app/                                    # Dev app for local testing
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   └── index.ts
│   │   └── e2e-tests/
│   │       └── app.test.ts
│   └── backend/                                # Dev backend for local testing
│       ├── package.json
│       └── src/
│           └── index.ts
├── plugins/
│   ├── argo-workflows-common/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   ├── report.api.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types.ts
│   │       ├── api.ts
│   │       ├── annotations.ts
│   │       ├── statusMapping.ts
│   │       ├── statusMapping.test.ts
│   │       ├── computeDAGColumns.ts
│   │       ├── computeDAGColumns.test.ts
│   │       └── duration.ts
│   │
│   ├── argo-workflows/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   ├── report.api.md
│   │   └── src/
│   │       ├── index.ts
│   │       ├── plugin.ts
│   │       ├── routes.ts
│   │       ├── api/
│   │       │   ├── index.ts
│   │       │   ├── ArgoWorkflowsApiClient.ts
│   │       │   └── ArgoWorkflowsApiClient.test.ts
│   │       ├── hooks/
│   │       │   ├── index.ts
│   │       │   ├── useArgoWorkflows.ts
│   │       │   ├── useArgoWorkflows.test.ts
│   │       │   ├── useWorkflowDetail.ts
│   │       │   ├── useWorkflowDetail.test.ts
│   │       │   ├── usePolling.ts
│   │       │   └── usePolling.test.ts
│   │       └── components/
│   │           ├── Router.tsx
│   │           ├── WorkflowTable/
│   │           │   ├── index.ts
│   │           │   ├── WorkflowTable.tsx
│   │           │   ├── WorkflowTable.test.tsx
│   │           │   ├── WorkflowExpandableRow.tsx
│   │           │   ├── WorkflowExpandableRow.test.tsx
│   │           │   ├── NodeStatusDots.tsx
│   │           │   ├── NodeStatusDots.test.tsx
│   │           │   ├── WorkflowFilters.tsx
│   │           │   └── WorkflowFilters.test.tsx
│   │           ├── DAGCardFlow/
│   │           │   ├── index.ts
│   │           │   ├── DAGCardFlow.tsx
│   │           │   ├── DAGCardFlow.test.tsx
│   │           │   ├── DAGNodeCard.tsx
│   │           │   ├── DAGNodeCard.test.tsx
│   │           │   ├── DAGNodeCard.module.css
│   │           │   ├── DAGArrow.tsx
│   │           │   └── DAGArrow.module.css
│   │           ├── NodeDetailPanel/
│   │           │   ├── index.ts
│   │           │   ├── NodeDetailPanel.tsx
│   │           │   ├── NodeDetailPanel.test.tsx
│   │           │   └── NodeDetailPanel.module.css
│   │           └── EmptyState/
│   │               ├── index.ts
│   │               ├── WorkflowEmptyState.tsx
│   │               └── WorkflowEmptyState.test.tsx
│   │
│   └── argo-workflows-backend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── CHANGELOG.md
│       ├── README.md
│       ├── report.api.md
│       └── src/
│           ├── index.ts
│           ├── plugin.ts
│           ├── router.ts
│           ├── router.test.ts
│           ├── service/
│           │   ├── index.ts
│           │   ├── ArgoWorkflowsService.ts
│           │   └── ArgoWorkflowsService.test.ts
│           └── mappers/
│               ├── index.ts
│               ├── workflowMapper.ts
│               └── workflowMapper.test.ts
│
├── app-config.yaml
├── catalog-info.yaml
├── backstage.json
├── package.json
├── tsconfig.json
├── playwright.config.ts
└── README.md
```

### Architectural Boundaries

**Package boundaries — three packages, one direction of dependency:**

```
┌─────────────────────────────────────────────────────┐
│                  argo-workflows-common               │
│  Types, API ref, annotations, status mapping,        │
│  DAG layout algorithm                                │
│  NO dependencies on frontend or backend packages     │
│  NO React, NO Node.js — pure TypeScript              │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌──────────────────────────┐
│   argo-workflows     │  │  argo-workflows-backend   │
│   (frontend)         │  │  (backend)                │
│  React components    │  │  Express routes           │
│  BUI, hooks, API     │  │  K8s CRD fetching         │
│  client              │  │  CRD transformation       │
│  Depends on: common  │  │  Depends on: common       │
│  NO backend imports  │  │  NO frontend imports      │
└──────────────────────┘  └──────────────────────────┘
         │      HTTP (REST)          │
         └───────────────────────────┘
```

**Data flow:**

```
Entity Page → EntityArgoWorkflowsContent → useArgoWorkflows(entity)
    → ArgoWorkflowsApiClient → HTTP → Backend routes
    → ArgoWorkflowsService → @backstage/plugin-kubernetes-node
    → Kubernetes API (Argo Workflow CRDs)
```

### Requirements to Structure Mapping

| FR Category | Package | Directory | Key Files |
|------------|---------|-----------|-----------|
| FR1–FR5: Workflow Discovery | frontend | `components/WorkflowTable/` | `WorkflowTable.tsx`, `WorkflowFilters.tsx` |
| FR1–FR5: Workflow Discovery | frontend | `hooks/` | `useArgoWorkflows.ts` |
| FR1–FR5: Workflow Discovery | backend | `router.ts`, `service/` | `GET /workflows/:namespace` |
| FR6–FR11: DAG Visualization | frontend | `components/DAGCardFlow/` | `DAGCardFlow.tsx`, `DAGNodeCard.tsx` |
| FR6–FR11: DAG Visualization | common | root | `computeDAGColumns.ts` |
| FR6–FR11: DAG Visualization | frontend | `hooks/` | `useWorkflowDetail.ts` |
| FR6–FR11: DAG Visualization | backend | `router.ts`, `service/` | `GET /workflows/:namespace/:name` |
| FR12–FR15: Node Inspection | frontend | `components/NodeDetailPanel/` | `NodeDetailPanel.tsx` |
| FR16–FR20: Entity Integration | common | root | `annotations.ts`, `api.ts` |
| FR16–FR20: Entity Integration | frontend | root | `plugin.ts`, `routes.ts` |
| FR16–FR20: Entity Integration | frontend | `components/EmptyState/` | `WorkflowEmptyState.tsx` |
| FR21–FR25: Backend & Data | backend | `service/`, `mappers/` | `ArgoWorkflowsService.ts`, `workflowMapper.ts` |
| FR21–FR25: Backend & Data | backend | root | `plugin.ts`, `router.ts` |
| FR26–FR28: Visual Consistency | common | root | `statusMapping.ts` |
| FR26–FR28: Visual Consistency | frontend | `components/DAGCardFlow/` | `DAGNodeCard.module.css` |

### Integration Points

**Internal communication:**

| From | To | Method | Data |
|------|----|--------|------|
| `WorkflowTable` | `useArgoWorkflows` | Hook | Entity → `WorkflowSummary[]` |
| `WorkflowExpandableRow` | `useWorkflowDetail` | Hook | namespace + name → `WorkflowDetail` |
| `DAGCardFlow` | `computeDAGColumns` | Function call | `NodeStatus[]` → `DAGColumn[]` |
| `DAGNodeCard` | `NodeDetailPanel` | Callback prop | Selected `NodeStatus` |
| `ArgoWorkflowsApiClient` | Backend routes | HTTP | REST via Backstage discovery |
| `ArgoWorkflowsService` | K8s plugin | Service call | `@backstage/plugin-kubernetes-node` |

**External integrations:**

| Integration | Package | Method |
|------------|---------|--------|
| Kubernetes API | backend | `@backstage/plugin-kubernetes-node` |
| Backstage catalog | frontend | `@backstage/plugin-catalog-react` |
| Backstage auth | backend | `coreServices.httpAuth` |
| Backstage discovery | frontend | `discoveryApiRef` |


## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** All technology choices are Backstage-native and version-compatible. TypeScript strict, React 18, BUI, new backend system, Yarn 4, Backstage CLI — no conflicts. The three-package architecture (`common`, `frontend`, `backend`) follows ADR011 and matches the Tekton plugin pattern.

**Pattern Consistency:** Naming conventions (PascalCase components, camelCase hooks/utils, UPPER_SNAKE constants) are consistent across all three packages. Status mapping is centralized in `common`. API response format (direct, camelCase, ISO dates) is uniform. Test co-location is enforced everywhere.

**Structure Alignment:** Project structure directly supports all architectural decisions. Each FR category maps to specific directories. Package boundaries enforce the dependency direction (common ← frontend, common ← backend, frontend ↔ backend via HTTP only).

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR | Status | Architectural Support |
|----|--------|----------------------|
| FR1–FR5: Workflow Discovery | ✅ Covered | Backend list route, `useArgoWorkflows` hook, BUI Table, filter chips |
| FR6–FR8: DAG Visualization (core) | ✅ Covered | `computeDAGColumns`, `DAGCardFlow`, `DAGNodeCard`, status mapping |
| FR9: Zoom, pan, fit-to-view | ⏳ Deferred to Phase 2 | MVP uses horizontal scroll. React Flow introduction in Phase 2 enables zoom/pan/fit. |
| FR10: Minimap | ⏳ Deferred to Phase 2 | Requires React Flow. Not available in CSS flexbox card flow. |
| FR11: Node type distinction | ✅ Covered | `NodeType` union type, visual treatment per type in `DAGNodeCard` |
| FR12–FR15: Node Inspection | ✅ Covered | `NodeDetailPanel` side panel, click interaction, error message display |
| FR16–FR20: Entity Integration | ✅ Covered | Annotation constants, plugin registration, empty states with guidance |
| FR21–FR25: Backend & Data | ✅ Covered | `ArgoWorkflowsService`, `workflowMapper`, K8s node plugin, auth |
| FR26–FR28: Visual Consistency | ✅ Covered | BUI tokens only, `statusMapping.ts`, automatic dark mode |

**Accepted MVP Limitations:**

| Feature | MVP Behavior | Phase 2 Enhancement |
|---------|-------------|-------------------|
| FR9: Zoom/pan/fit-to-view | Horizontal scroll on DAG card flow | React Flow canvas with zoom/pan/fit controls |
| FR10: Minimap | Not available | React Flow minimap component |
| Compressed nodes | Not decompressed — may show incomplete DAG for very large workflows | Backend decompression of `compressedNodes` |
| Nested DAG/Steps groups | Boundary nodes filtered out — flat visualization | Collapsible DAG groups |

**Non-Functional Requirements Coverage:**

| NFR | Status | Architectural Support |
|-----|--------|----------------------|
| List render < 2s | ✅ | Backend pagination, label selector filtering |
| DAG render < 1s for 50 nodes | ✅ | Client-side topological sort, CSS flexbox (no heavy library) |
| Polling (30s/5s/stop) | ✅ | `usePolling` hook with state-aware intervals |
| Backstage auth on all routes | ✅ | `httpAuth` from `coreServices` |
| Entity-scoped data | ✅ | Namespace isolation via annotations |
| WCAG 2.1 AA | ✅ | BUI built-in + React Aria for custom components |
| Graceful error handling | ✅ | Three-layer error handling (backend → API client → component) |

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with rationale. Types defined in TypeScript. API routes specified with request/response shapes. Error mapping table provided. Hook contracts defined.

**Structure Completeness:** Every file in the project tree is accounted for. Every FR maps to specific directories and files. Integration points are explicit with from/to/method/data.

**Pattern Completeness:** All 5 conflict areas addressed with rules and examples. Anti-patterns documented. Enforcement guidelines listed as 7 mandatory rules.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 31 FRs analyzed and categorized
- [x] NFRs mapped to architectural impact
- [x] Technical constraints identified (Backstage platform, BUI, community-plugins repo)
- [x] Cross-cutting concerns mapped (status mapping, annotations, polling, error handling, auth)

**✅ Architectural Decisions**
- [x] Data architecture: backend CRD transformation to typed responses
- [x] API pattern: frontend → backend REST routes
- [x] State management: React hooks + context only
- [x] DAG layout: client-side topological sort in common package
- [x] Auth: Backstage-native end-to-end
- [x] UI: BUI-only, no MUI

**✅ Implementation Patterns**
- [x] File naming conventions (PascalCase components, camelCase hooks/utils)
- [x] TypeScript naming (no I-prefix interfaces, union types over enums)
- [x] API format (direct response, camelCase JSON, ISO dates)
- [x] Status mapping centralization
- [x] Error handling three-layer pattern
- [x] Polling hook contract
- [x] Import rules across packages

**✅ Project Structure**
- [x] Complete directory tree with all files
- [x] Package boundaries defined and enforced
- [x] FR-to-directory mapping complete
- [x] Integration points documented

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — architecture is well-constrained by the Backstage platform, reducing the decision surface. All remaining decisions are documented with rationale and examples.

**Key Strengths:**
- Platform-dictated stack eliminates technology choice risk
- Three-package architecture with clear boundaries prevents cross-package contamination
- Centralized status mapping and annotation constants prevent inconsistency
- Typed API responses provide compile-time safety across frontend and backend
- Direction F (Tekton-style expandable rows) is familiar to Backstage users and simple to implement

**Areas for Phase 2 Enhancement:**
- React Flow introduction for zoom/pan/minimap on large workflows
- `argo-workflows-react` package for reusable hooks
- New frontend system support (`EntityContentBlueprint`)
- Compressed nodes decompression
- Optional Argo Server API integration
