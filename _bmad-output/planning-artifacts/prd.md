---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments:
  - '_bmad-output/planning-artifacts/research/technical-argo-workflows-backstage-plugin-research-2026-04-18.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 1
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: developer_tool
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document — Argo Workflows Plugin for Backstage

**Author:** Fjudith
**Date:** 2026-04-18

## Executive Summary

The Argo Workflows plugin for Backstage brings workflow execution observability directly into the Backstage service catalog, eliminating the context-switch to the Argo Workflows UI. Service owners and platform engineers can view workflow runs, inspect execution status, and navigate the workflow DAG topology — all from the entity page of the service that owns those workflows.

Argo Workflows is a CNCF graduated project with 13.5k+ GitHub stars and broad enterprise adoption for CI/CD, ML pipelines, and data processing. Despite this, no Backstage community plugin exists for it. This plugin fills that gap by providing a native Backstage experience built on the Backstage UI (BUI) design system, with an interactive DAG execution diagram as its centerpiece feature.

The plugin targets two primary user segments: service owners who need to monitor workflow health without leaving the developer portal, and platform engineers who manage Argo Workflows infrastructure and need a unified view across the service catalog. It integrates via the Backstage Kubernetes proxy (default) with optional Argo Server API support for advanced capabilities like log streaming and live status updates.

### What Makes This Special

Existing CI/CD Backstage plugins (Tekton, CodePipeline, CodeBuild) render pipeline runs as flat tables or linear step lists. Argo Workflows are inherently graph-shaped — DAGs with parallel branches, fan-out/fan-in patterns, nested sub-workflows, and retry logic. This plugin renders the actual workflow topology as an interactive diagram using React Flow and elkjs, with BUI-styled nodes showing real-time phase status (Succeeded, Failed, Running, Pending, Skipped). Users see the shape of their workflow, not just a list of steps — making it immediately clear where failures occurred, which branches ran in parallel, and how the execution flowed through the graph.

Built BUI-first using Backstage's native design tokens for automatic dark mode support and visual consistency. No external UI framework mismatch.

## Project Classification

- **Project Type:** Developer Tool — Backstage community plugin (npm packages)
- **Domain:** General (Developer Tooling / DevOps)
- **Complexity:** Medium — tri-package architecture, custom DAG visualization with React Flow + elkjs, dual integration strategy (K8s proxy + optional Argo Server API), old + new Backstage frontend system support
- **Project Context:** Greenfield — first-of-its-kind Argo Workflows plugin for the Backstage ecosystem

## Success Criteria

### User Success

- Platform engineers can see Argo Workflow execution status from the Backstage entity page without switching to the Argo UI
- Service owners can identify a failed workflow node and understand the failure context (which node, what phase, when it started/finished) within 3 clicks from the entity page
- The DAG diagram makes workflow topology immediately legible — parallel branches, dependencies, and execution flow are visually obvious at a glance
- Users can navigate workflows with 50+ nodes comfortably using zoom, pan, and minimap controls

### Business Success

- Accepted and merged into `backstage/community-plugins` within 3 months of initial PR
- 500+ npm weekly downloads within 6 months of release
- At least 5 community GitHub issues or PRs from external contributors within 6 months
- Referenced in at least one Backstage community showcase, blog post, or conference talk

### Technical Success

- Workflow list renders within 2 seconds for up to 100 workflows
- DAG diagram renders within 1 second for workflows with up to 50 nodes
- All 7 Argo workflow phases correctly mapped to BUI status colors in both light and dark themes
- Plugin passes `yarn build:api-reports`
- E2E test suite covers: entity page → workflow list → workflow detail → DAG view
- Zero runtime dependency on the Argo Server — K8s proxy path works standalone

### Measurable Outcomes

- Reduces context-switching for Argo Workflow monitoring from 2 tools (Backstage + Argo UI) to 1 for common read-only operations
- First Backstage community plugin providing native DAG visualization for any workflow engine

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP — deliver the minimum that lets service owners monitor Argo Workflow executions and diagnose failures from Backstage, without any dependency on the Argo Server.

**Resource Requirements:** Single developer with Backstage plugin experience and React/TypeScript proficiency. MVP achievable in 4-6 weeks.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Priya (Service Owner): workflow list → workflow detail → DAG diagram → node detail
- Kenji (SRE): fast failure identification via DAG topology and status colors

**Must-Have Capabilities:**
- `argo-workflows-common` — Shared types (`Workflow`, `NodeStatus`, annotations), API refs
- `argo-workflows-backend` — Backend plugin with K8s proxy routes (`/workflows/:namespace`, `/workflows/:namespace/:name`)
- `argo-workflows` (frontend) — Entity page tab with:
  - Workflow list table (BUI Table, pagination, sorting, status badge filtering)
  - Workflow detail view with interactive DAG execution diagram (React Flow + elkjs)
  - Custom BUI-styled DAG nodes with phase-to-status color mapping
  - Node detail panel (click node → phase, type, displayName, startedAt, finishedAt, duration, message)
  - Zoom, pan, fit-to-view, minimap controls
- Entity annotations: `backstage.io/kubernetes-namespace`, `backstage.io/kubernetes-label-selector`
- Dark mode via BUI design tokens
- Old frontend system registration (`createPlugin`/`createRoutableExtension`)

**Explicitly Out of MVP:**
- No Argo Server API integration (K8s proxy only)
- No log streaming or SSE live updates
- No workflow submission/resubmit actions
- No WorkflowTemplate or CronWorkflow tabs
- No entity overview card
- No `argo-workflows-react` package
- No new frontend system support
- No compressed nodes decompression
- No Backstage permission framework integration

### Phase 2 (Growth)

- WorkflowTemplate and CronWorkflow list tabs
- Entity overview card (latest workflow status on entity page)
- `argo-workflows-react` package with reusable hooks (`useArgoWorkflows`, `useWorkflowDetail`)
- New frontend system support (`EntityContentBlueprint`, `EntityCardBlueprint`)
- Collapsible DAG groups for nested DAG/Steps templates
- Node detail panel with inputs/outputs and artifact links
- Compressed nodes decompression for large workflows
- Comprehensive documentation, example configs, setup guide

### Phase 3 (Expansion)

- Optional Argo Server API backend integration (log streaming, SSE live updates)
- Workflow submission and resubmit actions
- Backstage permission framework (`argoworkflows.workflow.read`, `argoworkflows.workflow.create`)
- Composable React hooks for third-party plugin integration
- Workflow comparison view (diff two runs)
- Workflow metrics dashboard (success rate, duration trends)

### Risk Mitigation Strategy

**Technical Risks:**
- DAG rendering for large workflows → React Flow virtualization + elkjs layered algorithm; dynamic import to avoid bundle bloat
- Argo CRD schema variations across versions → Version-tolerant parsing with graceful handling of missing fields
- BUI API changes during transition period → Pin `@backstage/ui` version, use only stable components

**Market Risks:**
- No signal on what users actually want → Ship MVP fast, track GitHub issues and npm downloads, iterate on community feedback
- Community-plugins PR review timeline → Follow contribution guidelines precisely, engage maintainers early

**Resource Risks:**
- Single developer project → MVP scoped for 4-6 weeks
- Contingency: cut node detail panel from MVP, ship with DAG diagram only (still validates core assumption)

## User Journeys

### Journey 1: Priya, the Service Owner — "Did my deployment pipeline succeed?"

Priya is a backend engineer who owns the `payment-service` in her company's Backstage catalog. Her team uses Argo Workflows to orchestrate their CI/CD pipeline — build, test, security scan, deploy to staging, integration tests, deploy to production. She just merged a PR and wants to know if the pipeline went through.

**Opening Scene:** Priya opens the `payment-service` entity page in Backstage after merging her PR. She clicks the "Argo Workflows" tab.

**Rising Action:** She sees a table of recent workflow runs. The latest one shows a yellow "Running" badge. She clicks into it and sees the DAG diagram — her 12-node pipeline rendered as a graph. The build and test nodes are green (Succeeded), the security scan is blue (Running), and the downstream deploy nodes are gray (Pending).

**Climax:** Five minutes later she refreshes. The security scan node has turned red (Failed). She clicks the node and sees the detail panel — it failed after 47 seconds with a message about a CVE in a transitive dependency. She immediately knows what to fix without ever opening the Argo UI, kubectl, or a separate monitoring tool.

**Resolution:** Priya fixes the dependency, pushes again, and watches the new workflow run turn green node by node from the same Backstage page. She never left her developer portal.

### Journey 2: Marcus, the Platform Engineer — "Setting up Argo Workflows visibility for all teams"

Marcus is a platform engineer responsible for the company's Backstage instance and Argo Workflows infrastructure. He needs to give 15 service teams visibility into their workflow executions without granting them direct access to the Argo UI or kubectl.

**Opening Scene:** Marcus installs the `@backstage-community/plugin-argo-workflows` and `@backstage-community/plugin-argo-workflows-backend` packages. He adds the Argo Workflows CRD to the Kubernetes plugin's custom resources configuration.

**Rising Action:** He configures entity annotations on the `payment-service` catalog entry: `backstage.io/kubernetes-namespace: production`, `backstage.io/kubernetes-label-selector: app=payment-service`. He tests by opening the entity page and confirming the workflow list populates correctly.

**Climax:** Within a week, 8 of 15 teams have added annotations. The Argo Workflows tab gets consistent daily traffic. Teams are self-serving their workflow monitoring instead of filing tickets asking "what happened to my pipeline?"

**Resolution:** The platform team's Slack channel sees a 40% drop in workflow failure questions. Marcus adds the entity card to the default layout so every service gets a workflow status summary automatically.

### Journey 3: Kenji, the SRE — "Production incident: which workflow step broke?"

Kenji is an SRE on-call at 2 AM. PagerDuty fires an alert: the `data-pipeline` service's nightly ETL workflow has failed, and downstream dashboards are stale.

**Opening Scene:** Kenji opens the `data-pipeline` entity page in Backstage. He clicks the Argo Workflows tab and sees the latest workflow run with a red "Failed" badge.

**Rising Action:** He clicks into the failed workflow and the DAG diagram loads. It's a complex 35-node workflow with parallel data extraction branches. Most nodes are green, but one branch — `extract-salesforce` — is red. The nodes downstream of it (`transform-crm-data`, `load-warehouse-crm`) are gray (Omitted).

**Climax:** Kenji clicks the `extract-salesforce` node. The detail panel shows it failed after 12 minutes with a timeout error. The estimated duration was 5 minutes — it ran 2.4x longer than expected. The DAG makes it immediately clear that only the Salesforce branch is affected; other extraction branches (Stripe, HubSpot) all succeeded.

**Resolution:** Kenji pages the data team with a precise diagnosis: "Salesforce extraction timed out at 01:59 AM, only CRM dashboards affected, all other pipelines healthy." The DAG told the whole story.

### Journey 4: Aisha, the Plugin Integrator — "Embedding workflow status in my custom plugin"

Aisha is building a custom Backstage plugin for her company's release management dashboard. She wants to show the latest Argo Workflow status for each service alongside deployment information.

**Opening Scene:** Aisha discovers the `@backstage-community/plugin-argo-workflows-react` package. She reads the README and sees it exports reusable hooks like `useArgoWorkflows` and `useWorkflowDetail`.

**Rising Action:** She installs the react package and imports `useArgoWorkflows` in her release dashboard component. She passes the entity reference and gets back a typed list of recent workflows with their phases, durations, and timestamps.

**Climax:** Her release dashboard now shows a green/red/yellow indicator next to each service, pulled live from Argo Workflows data — all without navigating away from the release view.

**Resolution:** The Argo Workflows react package saved her weeks of building her own K8s integration and data fetching layer.

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|--------------------------|
| Priya (Service Owner) | Workflow list table, DAG diagram, node detail panel, status badges, polling/refresh |
| Marcus (Platform Engineer) | Plugin installation, entity annotation configuration, K8s custom resource setup, entity card |
| Kenji (SRE) | Fast DAG rendering for complex workflows, clear failure identification, blast radius visibility, timing data |
| Aisha (Plugin Integrator) | Reusable React hooks package, typed API, composable components |

## Innovation & Novel Patterns

### Detected Innovation Areas

- **First native DAG visualization in Backstage ecosystem.** No existing community plugin renders workflow execution as an interactive directed acyclic graph. New visualization paradigm for CI/CD observability within developer portals.
- **BUI-native graph rendering.** React Flow custom nodes built from BUI primitives and CSS tokens — visually indistinguishable from native Backstage components including automatic dark mode. Reusable pattern for other plugins needing graph visualization.
- **Blast radius visibility.** DAG topology makes it immediately clear which downstream nodes are affected by a failure — impossible to see in a flat table view. Critical for SRE incident response.

### Validation Approach

- Ship MVP with DAG diagram as default workflow detail view; measure engagement (clicks into DAG vs. staying on list view)
- Track community feedback via GitHub issues post-merge
- Compare time-to-diagnosis for workflow failures with and without DAG view (qualitative feedback from early adopters)

### Risk Mitigation

- **Risk:** DAG rendering performance degrades for 100+ node workflows. **Mitigation:** React Flow virtualization; elkjs handles large graphs efficiently; compressed nodes decompression in backend.
- **Risk:** DAG overwhelming for simple linear workflows. **Mitigation:** Workflow list table is always the entry point; DAG is a drill-down view.

## Developer Tool Specific Requirements

### Project-Type Overview

Backstage community plugin distributed as npm packages following `@backstage-community/plugin-argo-workflows-*` naming. Targets Backstage instances running the Kubernetes plugin with access to clusters running Argo Workflows.

### Technical Architecture

- **Package Structure:** 4 npm packages per Backstage ADR011 — `argo-workflows-common`, `argo-workflows`, `argo-workflows-react`, `argo-workflows-backend`
- **Backstage Compatibility:** Target latest stable release. `@backstage/core-plugin-api` and `@backstage/backend-plugin-api` as peer dependencies.
- **Frontend System:** Old system (`createPlugin`/`createRoutableExtension`) for MVP. New system (`EntityContentBlueprint`) for Growth phase.
- **Backend System:** New backend system only (`createBackendPlugin`). No legacy backend support.
- **UI Framework:** BUI-first (`@backstage/ui`). No MUI dependencies.

### API Surface

- **Frontend API:** `argoWorkflowsApiRef` — API client for fetching workflows via K8s proxy or backend routes
- **React Hooks (argo-workflows-react):** `useArgoWorkflows(entity)`, `useWorkflowDetail(namespace, name)`, `useDAGLayout(nodes)`
- **Backend Routes:** REST endpoints proxying to K8s API (`/workflows/:namespace`, `/workflows/:namespace/:name`)
- **Entity Annotations:** `backstage.io/kubernetes-namespace`, `backstage.io/kubernetes-label-selector`, `argoworkflows.io/cluster-name`, `argoworkflows.io/workflow-template`

### Installation and Configuration

- **Install:** `yarn add @backstage-community/plugin-argo-workflows @backstage-community/plugin-argo-workflows-backend`
- **app-config.yaml:** Kubernetes plugin custom resources for `argoproj.io/v1alpha1` Workflow CRDs
- **catalog-info.yaml:** Annotations linking entities to Argo Workflows namespaces and label selectors
- **RBAC:** K8s service account needs `get`, `list` on `workflows.argoproj.io`

### Documentation Requirements

- README.md per package with installation, configuration, and usage
- Screenshots of workflow list and DAG diagram (light and dark mode)
- Example `catalog-info.yaml` and `app-config.yaml`
- Troubleshooting guide for common setup issues (RBAC, namespace access)

### Implementation Considerations

- **Peer dependencies:** `@backstage/core-plugin-api`, `@backstage/backend-plugin-api`, `@backstage/plugin-kubernetes-react`
- **Bundle size:** React Flow + elkjs ~150KB gzipped. Dynamic imports for DAG component.
- **API reports:** Must pass `yarn build:api-reports` with `@public` JSDoc tags
- **Changesets:** Follow community-plugins changeset workflow

## Functional Requirements

### Workflow Discovery & Browsing

- FR1: Service owners can view a list of Argo Workflow executions associated with their Backstage catalog entity
- FR2: Service owners can filter the workflow list by execution status (Succeeded, Failed, Running, Pending, Error)
- FR3: Service owners can sort the workflow list by start time, duration, or status
- FR4: Service owners can paginate through workflow results when more than one page exists
- FR5: Service owners can search workflows by name within the workflow list

### Workflow Detail & DAG Visualization

- FR6: Service owners can view a single workflow execution's metadata (name, namespace, status, start time, finish time, duration)
- FR7: Service owners can view the workflow execution as an interactive DAG diagram showing all nodes and their dependency relationships
- FR8: Service owners can identify the execution phase of each node through distinct visual status indicators
- FR9: Service owners can zoom, pan, and fit-to-view the DAG diagram
- FR10: Service owners can use a minimap to orient themselves within large DAG diagrams
- FR11: Service owners can distinguish between node types (Pod, DAG, Steps, StepGroup, Retry, Suspend, HTTP, Skipped)

### Node Inspection

- FR12: Service owners can click a node in the DAG to view its detail information
- FR13: Service owners can see a node's phase, type, display name, start time, finish time, and duration in the detail panel
- FR14: Service owners can see a node's status message when one exists (e.g., error messages for failed nodes)
- FR15: SREs can identify which downstream nodes were affected by a failed node through the DAG topology

### Entity Integration

- FR16: Backstage administrators can associate catalog entities with Argo Workflows using entity annotations
- FR17: Backstage administrators can specify the Kubernetes namespace for workflow discovery via annotations
- FR18: Backstage administrators can filter workflows using Kubernetes label selectors via annotations
- FR19: The plugin can be added as a tab on the Backstage entity page for any annotated entity
- FR20: The plugin displays an appropriate empty state when no workflows are found

### Backend & Data Access

- FR21: The backend plugin fetches Argo Workflow CRDs from Kubernetes clusters configured in the Backstage Kubernetes plugin
- FR22: The backend plugin fetches a single workflow's full status including `status.nodes` for DAG rendering
- FR23: The backend plugin exposes REST routes for frontend consumption
- FR24: The backend plugin requires Backstage authentication for all data routes
- FR25: The plugin operates without requiring the Argo Server (K8s proxy only)

### Visual Consistency & Theming

- FR26: All plugin UI components use the Backstage UI (BUI) design system
- FR27: The plugin renders correctly in both light and dark themes without additional configuration
- FR28: DAG node status colors map to BUI status tokens (success, danger, warning, info, secondary)

### Configuration & Setup

- FR29: Plugin consumers can install via standard yarn/npm package installation
- FR30: Plugin consumers can configure CRD fetching through the Backstage Kubernetes plugin configuration
- FR31: The plugin provides a health check endpoint for operational monitoring

## Non-Functional Requirements

### Performance

- Workflow list API response and table render completes within 2 seconds for up to 100 workflows
- DAG diagram renders (layout computation + React Flow mount) within 1 second for up to 50 nodes
- DAG diagram remains interactive (zoom, pan, node click) with no perceptible lag for up to 100 nodes
- Dynamic import of React Flow + elkjs ensures DAG bundle does not impact workflow list initial load
- Polling interval configurable: 30s default for list, 5s for detail during Running phase, stops on terminal states

### Security

- All backend routes require Backstage authentication (except `/health`)
- Plugin only exposes workflow data for the namespace and cluster specified in entity annotations — no cross-entity data leakage
- K8s service account requires minimum RBAC: `get`, `list` on `workflows.argoproj.io`
- No secrets, tokens, or credentials stored in frontend or exposed to browser

### Accessibility

- BUI components inherit built-in accessibility (keyboard navigation, ARIA attributes, focus management)
- Workflow list table is fully keyboard-navigable
- DAG node status communicated through both color and icon/shape (not color alone) for color-blind users
- Node detail panel accessible via keyboard (Enter/Space to open, Escape to close)

### Integration

- Integrates with Backstage Kubernetes plugin for cluster configuration and authentication — no separate cluster config required
- Uses standard Backstage entity annotations for entity-to-workflow association
- Backend uses new Backstage backend system (`createBackendPlugin`) with `coreServices`
- Frontend uses `createPlugin` and `createRoutableExtension` from `@backstage/core-plugin-api`

### Reliability

- Gracefully handles Kubernetes API errors (timeout, 403, 404, 500) with user-friendly BUI Alert messages
- Displays clear empty state distinguishing "no workflows exist" from "configuration error"
- Error boundaries catch rendering failures and display recovery options
- DAG diagram handles malformed or incomplete `status.nodes` data without crashing
