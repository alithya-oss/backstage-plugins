---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
---

# Argo Workflows Plugin for Backstage - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Argo Workflows Plugin for Backstage, decomposing the requirements from the PRD, Architecture, and UX Design Specification into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Service owners can view a list of Argo Workflow executions associated with their Backstage catalog entity
FR2: Service owners can filter the workflow list by execution status (Succeeded, Failed, Running, Pending, Error)
FR3: Service owners can sort the workflow list by start time, duration, or status
FR4: Service owners can paginate through workflow results when more than one page exists
FR5: Service owners can search workflows by name within the workflow list
FR6: Service owners can view a single workflow execution's metadata (name, namespace, status, start time, finish time, duration)
FR7: Service owners can view the workflow execution as an interactive DAG diagram showing all nodes and their dependency relationships
FR8: Service owners can identify the execution phase of each node through distinct visual status indicators
FR9: Service owners can zoom, pan, and fit-to-view the DAG diagram
FR10: Service owners can use a minimap to orient themselves within large DAG diagrams
FR11: Service owners can distinguish between node types (Pod, DAG, Steps, StepGroup, Retry, Suspend, HTTP, Skipped)
FR12: Service owners can click a node in the DAG to view its detail information
FR13: Service owners can see a node's phase, type, display name, start time, finish time, and duration in the detail panel
FR14: Service owners can see a node's status message when one exists (e.g., error messages for failed nodes)
FR15: SREs can identify which downstream nodes were affected by a failed node through the DAG topology
FR16: Backstage administrators can associate catalog entities with Argo Workflows using entity annotations
FR17: Backstage administrators can specify the Kubernetes namespace for workflow discovery via annotations
FR18: Backstage administrators can filter workflows using Kubernetes label selectors via annotations
FR19: The plugin can be added as a tab on the Backstage entity page for any annotated entity
FR20: The plugin displays an appropriate empty state when no workflows are found
FR21: The backend plugin fetches Argo Workflow CRDs from Kubernetes clusters configured in the Backstage Kubernetes plugin
FR22: The backend plugin fetches a single workflow's full status including status.nodes for DAG rendering
FR23: The backend plugin exposes REST routes for frontend consumption
FR24: The backend plugin requires Backstage authentication for all data routes
FR25: The plugin operates without requiring the Argo Server (K8s proxy only)
FR26: All plugin UI components use the Backstage UI (BUI) design system
FR27: The plugin renders correctly in both light and dark themes without additional configuration
FR28: DAG node status colors map to BUI status tokens (success, danger, warning, info, secondary)
FR29: Plugin consumers can install via standard yarn/npm package installation
FR30: Plugin consumers can configure CRD fetching through the Backstage Kubernetes plugin configuration
FR31: The plugin provides a health check endpoint for operational monitoring

### NonFunctional Requirements

NFR1: Workflow list API response and table render completes within 2 seconds for up to 100 workflows
NFR2: DAG diagram renders (layout computation + mount) within 1 second for up to 50 nodes
NFR3: DAG diagram remains interactive with no perceptible lag for up to 100 nodes
NFR4: Dynamic import of DAG components ensures DAG bundle does not impact workflow list initial load
NFR5: Polling interval configurable: 30s default for list, 5s for detail during Running phase, stops on terminal states
NFR6: All backend routes require Backstage authentication (except /health)
NFR7: Plugin only exposes workflow data for the namespace and cluster specified in entity annotations — no cross-entity data leakage
NFR8: K8s service account requires minimum RBAC: get, list on workflows.argoproj.io
NFR9: No secrets, tokens, or credentials stored in frontend or exposed to browser
NFR10: BUI components inherit built-in accessibility (keyboard navigation, ARIA attributes, focus management)
NFR11: Workflow list table is fully keyboard-navigable
NFR12: DAG node status communicated through both color and icon/shape (not color alone) for color-blind users
NFR13: Node detail panel accessible via keyboard (Enter/Space to open, Escape to close)
NFR14: Integrates with Backstage Kubernetes plugin for cluster configuration and authentication
NFR15: Uses standard Backstage entity annotations for entity-to-workflow association
NFR16: Backend uses new Backstage backend system (createBackendPlugin) with coreServices
NFR17: Frontend uses createPlugin and createRoutableExtension from @backstage/core-plugin-api
NFR18: Gracefully handles Kubernetes API errors (timeout, 403, 404, 500) with user-friendly BUI Alert messages
NFR19: Displays clear empty state distinguishing "no workflows exist" from "configuration error"
NFR20: Error boundaries catch rendering failures and display recovery options
NFR21: DAG diagram handles malformed or incomplete status.nodes data without crashing

### Additional Requirements

From Architecture:
- AR1: Three-package architecture: argo-workflows-common, argo-workflows (frontend), argo-workflows-backend per Backstage ADR011
- AR2: Backend transforms raw Argo Workflow CRDs into typed API responses (WorkflowSummary, WorkflowDetail, NodeStatus)
- AR3: Frontend calls argo-workflows-backend REST routes via argoWorkflowsApiRef — does not interact with K8s API directly
- AR4: Client-side topological sort (Kahn's algorithm) in argo-workflows-common for DAG column layout
- AR5: React hooks + context only for state management — no external state library
- AR6: Status mapping (PHASE_STATUS_MAP, PHASE_ICON_MAP) centralized in argo-workflows-common/statusMapping.ts
- AR7: Three-layer error handling: backend route → frontend API client → React component
- AR8: usePolling hook with state-aware intervals (30s list, 5s running detail, stop on terminal)
- AR9: Co-located test files, PascalCase components, camelCase hooks/utils, UPPER_SNAKE constants
- AR10: Direct API responses (no wrapper), camelCase JSON fields, ISO 8601 dates, duration as seconds
- AR11: Workspace scaffold modeled after workspaces/aws/ and Tekton community plugin
- AR12: Must pass yarn build:api-reports with @public JSDoc tags
- AR13: Changesets for versioning per community-plugins conventions

### UX Design Requirements

UX-DR1: Direction F layout — Tekton-style expandable table rows with horizontal DAG card flow + side panel for node detail
UX-DR2: WorkflowExpandableRow component — expand/collapse button, only one row expanded at a time, expanded state persists during polling
UX-DR3: NodeStatusDots component — compact colored squares (14×14px) in table row summarizing node phases, overflow at >12 nodes shows "+N more"
UX-DR4: DAGCardFlow component — horizontal left-to-right CSS flexbox card flow with arrow indicators, parallel branches stacked vertically with "parallel" label
UX-DR5: DAGNodeCard component — status icon + displayName + duration, 150-180px wide, phase-colored 2px border, hover/selected/focused states
UX-DR6: NodeDetailPanel component — 300px side panel with phase badge, type, template, timing, error message, left border colored by status
UX-DR7: DAGArrow component — arrow indicators between DAG columns colored by path status (success/danger/inactive)
UX-DR8: WorkflowFilters component — filter chips for status filtering + search input
UX-DR9: WorkflowEmptyState component — distinct messages for "no workflows", "configuration error", "cannot reach cluster" with actionable guidance
UX-DR10: Poll indicator in toolbar — green dot + "Updated Xs ago" for active polling, gray dot + "Terminal" for completed workflows
UX-DR11: Three-tier status communication — workflow badge (tier 1), node status dots (tier 2), DAG card colors (tier 3)
UX-DR12: Keyboard accessibility — Tab through cards, Enter/Space to select, Escape to close panel, focus ring using --bui-border-focus
UX-DR13: Screen reader support — aria-label on all interactive elements, aria-expanded on expand buttons, aria-live on panel
UX-DR14: prefers-reduced-motion support — Running pulse animation falls back to static icon, panel slide falls back to instant show
UX-DR15: Node label truncation at 20 characters with ellipsis, full name on hover tooltip
UX-DR16: Duration displayed in monospace font to prevent layout shifts during polling updates

### FR Coverage Map

FR1: Epic 2 - View workflow list for entity
FR2: Epic 2 - Filter by status
FR3: Epic 2 - Sort by time/duration/status
FR4: Epic 2 - Paginate results
FR5: Epic 2 - Search by name
FR6: Epic 3 - View workflow metadata in expanded row
FR7: Epic 3 - View DAG diagram
FR8: Epic 3 - Phase status indicators on nodes
FR9: Deferred to Phase 2 - Zoom/pan/fit-to-view (requires React Flow)
FR10: Deferred to Phase 2 - Minimap (requires React Flow)
FR11: Epic 3 - Node type distinction
FR12: Epic 3 - Click node for detail
FR13: Epic 3 - Node detail panel metadata
FR14: Epic 3 - Node error message display
FR15: Epic 3 - Blast radius visibility
FR16: Epic 2 - Entity annotation association
FR17: Epic 2 - Namespace annotation
FR18: Epic 2 - Label selector annotation
FR19: Epic 2 - Entity page tab
FR20: Epic 2 - Empty state display
FR21: Epic 2 - Backend K8s CRD fetching
FR22: Epic 3 - Backend single workflow with status.nodes
FR23: Epic 2 - Backend REST routes
FR24: Epic 2 - Backend authentication
FR25: Epic 2 - No Argo Server dependency
FR26: Epic 2 - BUI design system
FR27: Epic 2 - Light/dark theme support
FR28: Epic 3 - DAG status color mapping
FR29: Epic 1 - Package installation
FR30: Epic 1 - CRD configuration
FR31: Epic 1 - Health check endpoint

## Epic List

### Epic 1: Workspace Foundation & Plugin Scaffold
After this epic, the workspace exists with all three packages configured, buildable, and testable — ready for feature development. Includes shared types, status mapping, annotation constants, and the backend plugin skeleton with health check.
**FRs covered:** FR29, FR30, FR31
**ARs covered:** AR1, AR6, AR9, AR10, AR11, AR12, AR13

### Epic 2: Workflow List & Entity Integration
After this epic, service owners can open the Argo Workflows tab on an entity page and see a table of workflow executions with status badges, filtering, sorting, pagination, and search. Empty/error states provide actionable guidance.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR16, FR17, FR18, FR19, FR20, FR21, FR23, FR24, FR25, FR26, FR27
**ARs covered:** AR2, AR3, AR5, AR7, AR8, AR10
**UX-DRs covered:** UX-DR8, UX-DR9, UX-DR10, UX-DR11 (tier 1)
**NFRs covered:** NFR1, NFR5, NFR6, NFR7, NFR8, NFR9, NFR14, NFR15, NFR16, NFR17, NFR18, NFR19

### Epic 3: DAG Visualization & Node Inspection
After this epic, service owners can expand a workflow row to see the horizontal DAG card flow, click nodes to see detail in the side panel, and diagnose failures with blast radius visibility. This is the plugin's defining experience.
**FRs covered:** FR6, FR7, FR8, FR11, FR12, FR13, FR14, FR15, FR22, FR28
**ARs covered:** AR4
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR11 (tiers 2+3), UX-DR15, UX-DR16
**NFRs covered:** NFR2, NFR3, NFR4, NFR21

### Epic 4: Accessibility & Polish
After this epic, the plugin meets WCAG 2.1 AA compliance with full keyboard navigation, screen reader support, reduced motion support, and comprehensive error boundaries. The plugin is ready for community-plugins PR submission.
**FRs covered:** Cross-cutting, enhances all FRs
**UX-DRs covered:** UX-DR12, UX-DR13, UX-DR14
**NFRs covered:** NFR10, NFR11, NFR12, NFR13, NFR20


## Epic 1: Workspace Foundation & Plugin Scaffold

After this epic, the workspace exists with all three packages configured, buildable, and testable — ready for feature development. Includes shared types, status mapping, annotation constants, and the backend plugin skeleton with health check.

### Story 1.1: Scaffold Workspace and Package Structure

As a plugin developer,
I want the workspace directory structure created with all three packages (common, frontend, backend) configured with package.json, tsconfig.json, and build tooling,
So that I can build, lint, and test each package independently.

**Acceptance Criteria:**

**Given** the workspace directory `workspaces/argo-workflows/` does not exist
**When** the scaffold is created following the architecture specification
**Then** the directory structure matches the architecture document's project tree
**And** `yarn install` completes without errors
**And** `yarn build` succeeds for all three packages
**And** `yarn lint` passes for all three packages
**And** `yarn test` runs (even if no tests exist yet)
**And** `backstage.json` pins the Backstage version
**And** `.changeset/config.json` is configured for the workspace

### Story 1.2: Shared Types, API Ref, and Annotation Constants

As a plugin developer,
I want the `argo-workflows-common` package to export all shared TypeScript types, the API ref, and annotation constants,
So that both frontend and backend packages can import a single source of truth for types and configuration.

**Acceptance Criteria:**

**Given** the `argo-workflows-common` package exists
**When** the shared types are implemented
**Then** `WorkflowSummary`, `WorkflowDetail`, `NodeStatus`, `NodeStatusSummary` interfaces are exported
**And** `WorkflowPhase`, `NodePhase`, `NodeType` union types are exported
**And** `argoWorkflowsApiRef` and `ArgoWorkflowsApi` interface are exported
**And** `ARGO_WORKFLOWS_NAMESPACE_ANNOTATION`, `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION`, `ARGO_WORKFLOWS_CLUSTER_ANNOTATION` constants are exported
**And** `yarn build:api-reports` generates a valid `report.api.md`
**And** all exports use `@public` JSDoc tags

### Story 1.3: Status Mapping and Duration Utilities

As a plugin developer,
I want centralized status mapping (`PHASE_STATUS_MAP`, `PHASE_ICON_MAP`) and duration formatting utilities in the common package,
So that all UI components use identical phase-to-status and phase-to-icon mappings.

**Acceptance Criteria:**

**Given** the `argo-workflows-common` package has types defined
**When** status mapping utilities are implemented
**Then** `PHASE_STATUS_MAP` maps all 7 `NodePhase` values to BUI status strings (success, danger, warning, info, secondary)
**And** `PHASE_ICON_MAP` maps all 7 `NodePhase` values to icon characters (✓, ✗, ⚠, ◌, ○, ⊘, —)
**And** `formatDuration(seconds: number): string` returns human-readable duration (e.g., "3m 47s", "12s", "1h 5m")
**And** unit tests cover all phase mappings and duration edge cases (0s, negative, undefined)

### Story 1.4: Backend Plugin Skeleton with Health Check

As a platform engineer,
I want the `argo-workflows-backend` plugin registered with the Backstage backend system and exposing a `/health` endpoint,
So that I can verify the plugin is loaded and operational.

**Acceptance Criteria:**

**Given** the `argo-workflows-backend` package exists
**When** the backend plugin is implemented
**Then** `createBackendPlugin` is used with pluginId `'argo-workflows'`
**And** the plugin registers an Express router via `coreServices.httpRouter`
**And** `GET /health` returns `{ status: 'ok' }` with HTTP 200
**And** the `/health` endpoint does NOT require Backstage authentication
**And** the dev backend (`packages/backend/`) loads the plugin successfully
**And** unit tests verify the health endpoint response

### Story 1.5: Frontend Plugin Skeleton with Entity Page Tab

As a service owner,
I want the `argo-workflows` frontend plugin registered with Backstage and mountable as an entity page tab,
So that I can see an "Argo Workflows" tab on entity pages.

**Acceptance Criteria:**

**Given** the `argo-workflows` frontend package exists
**When** the frontend plugin is implemented
**Then** `createPlugin` registers the plugin with id `'argo-workflows'`
**And** `createRoutableExtension` exports `EntityArgoWorkflowsContent`
**And** the dev app (`packages/app/`) mounts the plugin on the entity page
**And** navigating to an entity page shows an "Argo Workflows" tab
**And** clicking the tab renders a placeholder component ("Argo Workflows content coming soon")
**And** `yarn build:api-reports` generates a valid `report.api.md`


## Epic 2: Workflow List & Entity Integration

After this epic, service owners can open the Argo Workflows tab on an entity page and see a table of workflow executions with status badges, filtering, sorting, pagination, and search. Empty/error states provide actionable guidance.

### Story 2.1: Backend Workflow List Route with K8s CRD Fetching

As a service owner,
I want the backend to fetch Argo Workflow CRDs from Kubernetes and expose them as a REST endpoint,
So that the frontend can display workflow data without direct K8s access.

**Acceptance Criteria:**

**Given** the backend plugin is running and connected to a Kubernetes cluster via `@backstage/plugin-kubernetes-node`
**When** `GET /workflows/:namespace?labelSelector=app%3Dpayment-service` is called with valid Backstage authentication
**Then** the response is an array of `WorkflowSummary` objects with camelCase JSON fields
**And** each summary includes name, namespace, phase, startedAt, finishedAt, duration, and nodes (phase + displayName only)
**And** the `labelSelector` query parameter filters workflows by Kubernetes labels
**And** `limit` and `offset` query parameters support pagination
**And** a 403 K8s error returns HTTP 403 with `ErrorResponse` format and actionable message
**And** a 404 K8s error returns HTTP 404 with namespace-specific guidance
**And** a K8s timeout returns HTTP 504 with retry guidance
**And** the route requires Backstage `httpAuth` authentication
**And** unit tests cover success, error mapping, and pagination scenarios

### Story 2.2: Frontend API Client

As a plugin developer,
I want a typed API client that calls the backend REST routes via Backstage discovery,
So that frontend components can fetch workflow data through a clean interface.

**Acceptance Criteria:**

**Given** the backend workflow list route is available
**When** the API client is implemented
**Then** `ArgoWorkflowsApiClient` implements the `ArgoWorkflowsApi` interface
**And** `listWorkflows(namespace, labelSelector)` calls `GET /workflows/:namespace` and returns `WorkflowSummary[]`
**And** `getWorkflow(namespace, name)` calls `GET /workflows/:namespace/:name` and returns `WorkflowDetail`
**And** the client uses `discoveryApi` to resolve the backend URL
**And** the client uses `fetchApi` for authenticated requests
**And** HTTP errors are caught and thrown as `ArgoWorkflowsError` with message, code, and statusCode
**And** `createApiFactory` registers the client with `argoWorkflowsApiRef`
**And** unit tests mock `fetchApi` and verify request construction and error handling

### Story 2.3: Polling Hook

As a service owner,
I want the workflow data to refresh automatically at appropriate intervals,
So that I see current workflow status without manually refreshing the page.

**Acceptance Criteria:**

**Given** the API client is available
**When** the `usePolling` hook is implemented
**Then** it accepts a fetch function, interval in milliseconds, and optional `enabled` and `stopWhen` parameters
**And** it returns `{ data, loading, error, lastUpdated }`
**And** `loading` is `true` only on initial fetch — polling refreshes update `data` silently
**And** polling pauses when `document.hidden` is `true` (tab not visible)
**And** polling stops when `stopWhen(data)` returns `true`
**And** errors during polling do NOT clear previous data
**And** `lastUpdated` tracks the timestamp of the last successful fetch
**And** unit tests cover initial load, polling cycle, tab visibility, stop condition, and error resilience

### Story 2.4: Workflow List Hook with Entity Annotations

As a service owner,
I want workflow data fetched automatically based on my entity's annotations,
So that I see workflows relevant to my service without any manual configuration.

**Acceptance Criteria:**

**Given** an entity has `backstage.io/kubernetes-namespace` and optionally `backstage.io/kubernetes-label-selector` annotations
**When** the `useArgoWorkflows` hook is called with the entity
**Then** it reads the namespace and label selector from entity annotations
**And** it calls `listWorkflows` via the API client with the resolved parameters
**And** it uses `usePolling` with a 30-second interval
**And** it returns `{ workflows, loading, error }`
**And** if the namespace annotation is missing, it returns an error indicating missing configuration
**And** unit tests verify annotation resolution, API call construction, and error states

### Story 2.5: Workflow List Table with Status Badges

As a service owner,
I want to see a table of my workflow executions with status badges, start times, and durations,
So that I can quickly assess the health of my workflows.

**Acceptance Criteria:**

**Given** the `useArgoWorkflows` hook returns workflow data
**When** the `WorkflowTable` component renders
**Then** it displays a BUI Table with columns: expand button, Name, Status, Node Status, Started, Duration, Namespace
**And** the Status column shows a BUI Badge with the workflow phase (Succeeded/Failed/Running/Pending/Error) using `PHASE_STATUS_MAP` colors
**And** the Name column displays the workflow name as a styled link
**And** the Started column shows relative time ("2 min ago", "1 hour ago")
**And** the Duration column shows formatted duration in monospace font
**And** the table supports sorting by Started and Duration columns via BUI `useTable`
**And** the table supports pagination via BUI `useTable` with configurable page size
**And** a loading state shows 3 skeleton table rows
**And** unit tests verify table rendering with mock workflow data

### Story 2.6: Workflow Filters and Search

As a service owner,
I want to filter workflows by status and search by name,
So that I can quickly find the workflow I'm looking for.

**Acceptance Criteria:**

**Given** the workflow list table is displayed
**When** the `WorkflowFilters` component renders above the table
**Then** filter chips are displayed for: All, Succeeded, Failed, Running, Pending
**And** clicking a filter chip toggles that status filter (multiple can be active)
**And** clicking "All" clears all filters
**And** a search input filters workflows by name (client-side substring match)
**And** when filters result in zero matches, "No workflows match the current filters" is shown with a "Clear filters" link
**And** the poll indicator ("● Updated 5s ago") is displayed at the right end of the toolbar
**And** unit tests verify filter toggling, search filtering, and empty filter state

### Story 2.7: Empty and Error States

As a platform engineer,
I want clear, actionable messages when workflows can't be loaded or don't exist,
So that I can diagnose configuration issues without guessing.

**Acceptance Criteria:**

**Given** the Argo Workflows tab is opened on an entity page
**When** no workflows are found
**Then** a BUI Alert (info) displays "No Argo Workflows found in namespace `{ns}` matching label selector `{selector}`."
**When** the entity has no namespace annotation
**Then** a BUI Alert (warning) displays "No Argo Workflows annotations found on this entity. Add `backstage.io/kubernetes-namespace` to your catalog-info.yaml."
**When** the backend returns a 403 error
**Then** a BUI Alert (danger) displays "Access denied. The Backstage service account needs `get` and `list` permissions on `workflows.argoproj.io`."
**When** the backend returns a 502/504 error
**Then** a BUI Alert (danger) displays "Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration."
**And** each error state uses the `WorkflowEmptyState` component
**And** unit tests verify each error type renders the correct message


## Epic 3: DAG Visualization & Node Inspection

After this epic, service owners can expand a workflow row to see the horizontal DAG card flow, click nodes to see detail in the side panel, and diagnose failures with blast radius visibility. This is the plugin's defining experience.

### Story 3.1: Backend Workflow Detail Route with status.nodes

As a service owner,
I want the backend to return a single workflow's full detail including all node statuses,
So that the frontend can render the DAG execution diagram.

**Acceptance Criteria:**

**Given** the backend plugin has the workflow list route working
**When** `GET /workflows/:namespace/:name` is called with valid Backstage authentication
**Then** the response is a `WorkflowDetail` object including the full `nodes` array (NodeStatus with id, displayName, type, phase, children, outboundNodes, boundaryID, startedAt, finishedAt, duration, message, templateName)
**And** the `workflowMapper` transforms the raw CRD `status.nodes` map into a flat `NodeStatus[]` array
**And** boundary nodes (type DAG, Steps, StepGroup) are included in the response but flagged by type for frontend filtering
**And** error responses follow the same `ErrorResponse` format as the list route
**And** unit tests verify the mapper handles complete, partial, and empty `status.nodes` data

### Story 3.2: DAG Layout Algorithm (computeDAGColumns)

As a plugin developer,
I want a topological sort algorithm that transforms the flat node list into ordered columns for horizontal rendering,
So that the DAG card flow can display nodes in correct execution order with parallel branches grouped.

**Acceptance Criteria:**

**Given** a `NodeStatus[]` array from a workflow detail response
**When** `computeDAGColumns(nodes)` is called
**Then** it returns a `DAGColumn[]` array ordered left-to-right by execution stage
**And** each `DAGColumn` contains `nodes: NodeStatus[]` (parallel nodes) and `isParallel: boolean`
**And** nodes at the same topological level are grouped into the same column
**And** boundary nodes (type DAG, Steps, StepGroup) are filtered out — only execution nodes appear
**And** the algorithm handles linear workflows (single node per column)
**And** the algorithm handles fan-out/fan-in patterns (multiple nodes in parallel columns)
**And** the algorithm handles workflows with a single node
**And** the algorithm returns an empty array for empty input
**And** unit tests cover: linear, parallel, fan-out/fan-in, single node, empty, and malformed data

### Story 3.3: Workflow Detail Hook

As a service owner,
I want the full workflow detail fetched when I expand a row,
So that the DAG can render with current node data.

**Acceptance Criteria:**

**Given** the API client's `getWorkflow` method is available
**When** the `useWorkflowDetail(namespace, name)` hook is called
**Then** it fetches the `WorkflowDetail` via the API client
**And** it uses `usePolling` with 5-second interval when the workflow phase is Running
**And** polling stops automatically when the workflow reaches a terminal state (Succeeded, Failed, Error)
**And** it returns `{ workflow, loading, error }`
**And** `loading` is `true` only on initial fetch
**And** unit tests verify polling behavior for running vs. terminal workflows

### Story 3.4: Expandable Row with DAG Card Flow

As a service owner,
I want to click an expand button on a workflow row to reveal the DAG execution diagram inline,
So that I can see the workflow topology without leaving the list view.

**Acceptance Criteria:**

**Given** the workflow list table is displayed
**When** the user clicks the expand button (▶) on a workflow row
**Then** the row expands to reveal the `DAGCardFlow` component below the table row
**And** the expand button rotates 90° and changes to info color
**And** the row background highlights with `--bui-bg-neutral-2`
**And** the `DAGCardFlow` renders a horizontal left-to-right flow of `DAGNodeCard` components grouped into columns
**And** parallel nodes in the same column are stacked vertically with a "parallel" label above
**And** `DAGArrow` components connect columns with status-colored arrows (success=green, danger=red, inactive=gray dashed)
**And** only one row can be expanded at a time — expanding a new row collapses the previous
**And** the expanded row shows a loading skeleton while `useWorkflowDetail` fetches data
**And** horizontal scroll activates when the DAG overflows the container width
**And** the expanded state persists during polling updates (row doesn't collapse on refresh)
**And** unit tests verify expand/collapse behavior, single-row constraint, and loading state

### Story 3.5: DAG Node Cards with Status Visualization

As a service owner,
I want each node in the DAG to show its name, status icon, and duration as a compact card,
So that I can identify node phases at a glance.

**Acceptance Criteria:**

**Given** the `DAGCardFlow` is rendered with workflow nodes
**When** `DAGNodeCard` components render for each node
**Then** each card shows: status icon (from `PHASE_ICON_MAP`) + displayName + duration (monospace)
**And** the card border is colored by phase using `PHASE_STATUS_MAP` → BUI border tokens (2px)
**And** Succeeded nodes have green borders, Failed/Error have red, Running has blue, Pending has yellow
**And** Skipped and Omitted nodes are dimmed (opacity 0.5) with neutral borders
**And** displayName truncates with ellipsis at container width, full name shown on hover tooltip
**And** duration uses monospace font (`--bui-font-monospace`, 10px)
**And** cards are 150–180px wide, ~48px tall with 8px 12px padding
**And** hover state shifts background to `--bui-bg-neutral-3`
**And** unit tests verify rendering for all 7 phase states and truncation behavior

### Story 3.6: Node Status Dots in Table Row

As a service owner,
I want a compact visual summary of node phases in each table row,
So that I can assess node-level health without expanding the row.

**Acceptance Criteria:**

**Given** the workflow list table displays `WorkflowSummary` data
**When** the `NodeStatusDots` component renders in the "Node Status" column
**Then** it displays a row of colored squares (14×14px, 3px border-radius) — one per node
**And** each square is colored by the node's phase and contains the phase icon character
**And** when there are more than 12 nodes, the first 10 are shown with "+N more" text
**And** hovering a dot shows a tooltip with the node's displayName and phase
**And** an empty workflow (no nodes) shows a single gray dash
**And** the container has an `aria-label` summarizing node counts by phase
**And** unit tests verify rendering for various node counts, overflow, and empty state

### Story 3.7: Node Detail Panel

As a service owner,
I want to click a node card in the DAG to see its detailed metadata in a side panel,
So that I can read error messages, timing data, and template information without leaving the DAG view.

**Acceptance Criteria:**

**Given** the DAG card flow is rendered with node cards
**When** the user clicks a `DAGNodeCard`
**Then** the `NodeDetailPanel` appears to the right of the DAG (300px wide)
**And** the DAG area shrinks to accommodate the panel (flex layout)
**And** the panel header shows the status icon + node displayName + close button (×)
**And** the panel body shows a metadata grid: Phase (Badge), Type, Template, Started, Finished, Duration
**And** for Failed/Error nodes, an error message box appears below the metadata with monospace text on a danger-colored background
**And** the panel's left border is colored by the node's phase (3px)
**And** clicking a different node updates the panel content in place (no slide animation)
**And** clicking the same node again or the close button (×) closes the panel — DAG takes full width
**And** pressing Escape closes the panel
**And** the selected node card shows a blue selection ring (`box-shadow: 0 0 0 2px var(--bui-fg-info)`)
**And** unit tests verify panel open/close, content rendering for all phases, and error message display


## Epic 4: Accessibility & Polish

After this epic, the plugin meets WCAG 2.1 AA compliance with full keyboard navigation, screen reader support, reduced motion support, and comprehensive error boundaries. The plugin is ready for community-plugins PR submission.

### Story 4.1: Keyboard Navigation for Workflow Table and Expand

As a service owner using keyboard navigation,
I want to navigate the workflow table and expand/collapse rows using only the keyboard,
So that I can use the plugin without a mouse.

**Acceptance Criteria:**

**Given** the workflow list table is displayed
**When** the user navigates with keyboard
**Then** Tab moves focus between expand buttons in the table rows
**And** Enter or Space on a focused expand button toggles the expanded state
**And** the expand button shows a visible focus ring using `--bui-border-focus`
**And** the expand button has `aria-expanded="true|false"` and `aria-controls="expanded-content-{id}"`
**And** the expanded content area has `role="region"` and `aria-label="Workflow DAG for {workflow-name}"`
**And** filter chips are focusable via Tab with Enter/Space to toggle
**And** the search input is focusable via Tab
**And** unit tests verify Tab order, aria attributes, and keyboard activation

### Story 4.2: Keyboard Navigation for DAG Cards and Node Panel

As a service owner using keyboard navigation,
I want to navigate DAG node cards and open/close the detail panel using only the keyboard,
So that I can inspect workflow nodes without a mouse.

**Acceptance Criteria:**

**Given** a workflow row is expanded showing the DAG card flow
**When** the user navigates with keyboard
**Then** Tab moves focus through DAG node cards left-to-right, top-to-bottom within columns
**And** each card shows a visible focus ring using `--bui-border-focus`
**And** Enter or Space on a focused card opens the NodeDetailPanel for that node
**And** when the panel opens, focus moves to the panel content
**And** Tab cycles through panel content (metadata fields, close button)
**And** Escape closes the panel and returns focus to the previously selected card
**And** each `DAGNodeCard` has `role="button"`, `tabindex="0"`, and `aria-label="{displayName}, {phase}, {duration}"`
**And** `aria-pressed="true"` is set on the selected card
**And** unit tests verify focus movement, panel open/close via keyboard, and focus restoration

### Story 4.3: Screen Reader Support

As a service owner using a screen reader,
I want all plugin content announced meaningfully,
So that I can understand workflow status and navigate the DAG without visual cues.

**Acceptance Criteria:**

**Given** the plugin is rendered
**When** a screen reader reads the content
**Then** the `NodeStatusDots` container has `aria-label="Node status: {N} succeeded, {N} failed, {N} running, {N} pending, {N} omitted"`
**And** each individual dot has `title="{displayName}: {phase}"` for tooltip announcement
**And** the `DAGCardFlow` container has `role="img"` and `aria-label="Workflow execution graph with {N} nodes: {phase summary}"`
**And** the `NodeDetailPanel` has `role="complementary"` and `aria-label="Node detail for {displayName}"`
**And** the `NodeDetailPanel` has `aria-live="polite"` so content changes are announced when a different node is selected
**And** the close button has `aria-label="Close node detail panel"`
**And** error alerts use BUI Alert's built-in `role="alert"` for immediate announcement
**And** the poll indicator has `aria-live="off"` (silent — too frequent for announcement)
**And** unit tests assert all aria attributes are present and correctly populated

### Story 4.4: Reduced Motion and Animation Accessibility

As a service owner with motion sensitivity,
I want animations to be disabled when I have reduced motion preferences set,
So that the plugin doesn't cause discomfort.

**Acceptance Criteria:**

**Given** the user has `prefers-reduced-motion: reduce` set in their OS/browser
**When** the plugin renders
**Then** the Running node pulse animation falls back to a static "Running" icon (◌)
**And** the expand/collapse row transition is instant (no height animation)
**And** the NodeDetailPanel appearance is instant (no slide animation)
**And** the poll indicator dot does not pulse
**And** all animation fallbacks are implemented via CSS `@media (prefers-reduced-motion: reduce)` or a shared utility
**And** unit tests verify that animation classes are not applied when reduced motion is active

### Story 4.5: Error Boundaries and Graceful Degradation

As a service owner,
I want the plugin to handle rendering failures gracefully without crashing the entire Backstage page,
So that a bug in one component doesn't break my developer portal.

**Acceptance Criteria:**

**Given** the plugin is rendered on an entity page
**When** the `DAGCardFlow` component throws a rendering error (e.g., malformed node data)
**Then** an error boundary catches the error and displays a BUI Alert: "Unable to render workflow graph. Showing metadata only."
**And** a fallback metadata list shows the workflow's name, phase, start time, finish time, and duration
**When** the `NodeDetailPanel` throws a rendering error
**Then** the panel shows "Unable to display node details" without affecting the DAG view
**When** the `WorkflowTable` throws a rendering error
**Then** the tab shows "Something went wrong loading Argo Workflows. Try refreshing the page." with a refresh link
**And** error boundaries log the error to the Backstage logger for debugging
**And** unit tests verify each error boundary catches errors and renders the correct fallback

### Story 4.6: Documentation and Community Release Preparation

As a plugin consumer,
I want comprehensive README documentation with installation instructions, configuration examples, and screenshots,
So that I can set up the plugin in my Backstage instance.

**Acceptance Criteria:**

**Given** all plugin functionality is implemented and tested
**When** the documentation is created
**Then** each package (common, frontend, backend) has a README.md with installation instructions
**And** the frontend README includes: `yarn add` command, `EntityPage.tsx` integration code, and `app-config.yaml` K8s custom resources configuration
**And** the backend README includes: `yarn add` command, backend registration code, and RBAC requirements
**And** example `catalog-info.yaml` annotations are documented
**And** a troubleshooting section covers: missing annotations, RBAC errors, cluster connectivity
**And** `yarn build:api-reports` passes for all three packages with no diff
**And** changesets are created for the initial release
**And** the workspace `README.md` provides an overview with links to each package
