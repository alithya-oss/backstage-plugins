# @backstage-community/plugin-argo-workflows-backend

Backend plugin for fetching Argo Workflow CRDs from Kubernetes and exposing them as REST endpoints for the Backstage frontend.

## Installation

```bash
yarn add @backstage-community/plugin-argo-workflows-backend
```

## Usage

Add the plugin to your backend:

```typescript
// packages/backend/src/index.ts
backend.add(import('@backstage-community/plugin-argo-workflows-backend'));
```
