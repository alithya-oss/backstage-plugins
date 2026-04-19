# Argo Workflows Plugin for Backstage

Visualize and monitor [Argo Workflows](https://argoproj.github.io/workflows/) directly from your Backstage catalog entities. Service owners can view workflow executions, inspect DAG topology, and diagnose failures — all without leaving Backstage.

## Features

- **Workflow list table** with status badges, sorting, filtering, search, and pagination
- **Expandable DAG visualization** — horizontal card flow showing execution topology inline
- **Node detail panel** — click any node to see phase, timing, template, and error messages
- **Node status dots** — compact phase summary in each table row
- **Polling** — auto-refresh at 30s (list) and 5s (running workflows), stops on terminal states
- **Accessibility** — keyboard navigation, screen reader support, reduced motion, error boundaries
- **BUI design system** — uses Backstage UI tokens for light/dark theme support

## Packages

| Package | Description |
|---------|-------------|
| [`@backstage-community/plugin-argo-workflows`](./plugins/argo-workflows/) | Frontend plugin (React components, hooks, API client) |
| [`@backstage-community/plugin-argo-workflows-backend`](./plugins/argo-workflows-backend/) | Backend plugin (K8s CRD fetching, REST routes) |
| [`@backstage-community/plugin-argo-workflows-common`](./plugins/argo-workflows-common/) | Shared types, utilities, API ref, status mapping |

## Quick Start

1. Install the backend plugin — see [backend README](./plugins/argo-workflows-backend/README.md)
2. Install the frontend plugin — see [frontend README](./plugins/argo-workflows/README.md)
3. Add annotations to your catalog entities — see [Entity Annotations](#entity-annotations)

## Entity Annotations

Add these annotations to your `catalog-info.yaml`:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/kubernetes-namespace: production
    backstage.io/kubernetes-label-selector: app=my-service
```

| Annotation | Required | Description |
|-----------|----------|-------------|
| `backstage.io/kubernetes-namespace` | Yes | K8s namespace where workflows run |
| `backstage.io/kubernetes-label-selector` | No | Label selector to filter workflows |

## Architecture

The plugin follows Backstage's three-package architecture (ADR011):

```
Entity Page → Frontend Plugin → REST API → Backend Plugin → Kubernetes API → Argo Workflow CRDs
```

No Argo Server required — the backend fetches CRDs directly from the Kubernetes API.

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
