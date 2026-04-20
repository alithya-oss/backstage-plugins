# @alithya-oss/backstage-plugin-argo-workflows-common

Shared types, utilities, and API reference for the Argo Workflows plugin. Used by both the frontend and backend packages.

## Installation

This package is typically installed automatically as a dependency of the frontend or backend plugin. If needed directly:

```bash
yarn add @alithya-oss/backstage-plugin-argo-workflows-common
```

## Exports

### Types

- `WorkflowSummary` — Workflow list item (name, namespace, phase, timing, node summaries)
- `WorkflowDetail` — Full workflow with `NodeStatus[]` for DAG rendering
- `NodeStatus` — Node metadata (id, displayName, type, phase, children, timing, message)
- `NodeStatusSummary` — Lightweight node summary (displayName, phase)
- `DAGColumn` — Column in the DAG layout (nodes, isParallel)
- `WorkflowPhase`, `NodePhase`, `NodeType` — Union types
- `ArgoWorkflowsApi` — API client interface

### Utilities

- `computeDAGColumns(nodes)` — Topological sort (Kahn's algorithm) for DAG column layout
- `formatDuration(seconds)` — Human-readable duration formatting
- `PHASE_STATUS_MAP` — Maps phases to BUI status strings
- `PHASE_ICON_MAP` — Maps phases to icon characters

### Constants

- `argoWorkflowsApiRef` — Backstage API reference
- `ARGO_WORKFLOWS_NAMESPACE_ANNOTATION`
- `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION`
- `ARGO_WORKFLOWS_CLUSTER_ANNOTATION`

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
