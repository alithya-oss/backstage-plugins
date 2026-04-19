# Argo Workflows Plugins for Backstage

This workspace contains the Argo Workflows plugins for Backstage, providing workflow execution observability directly in the Backstage service catalog.

## Packages

| Package | Description |
|---------|-------------|
| [`@backstage-community/plugin-argo-workflows-common`](./plugins/argo-workflows-common/) | Shared types, API refs, and utilities |
| [`@backstage-community/plugin-argo-workflows`](./plugins/argo-workflows/) | Frontend plugin with workflow list and DAG visualization |
| [`@backstage-community/plugin-argo-workflows-backend`](./plugins/argo-workflows-backend/) | Backend plugin for K8s CRD fetching |

## Development

```bash
# Install dependencies
yarn install

# Start the dev app
yarn start

# Build all packages
yarn build:all

# Run tests
yarn test

# Lint
yarn lint:all
```
