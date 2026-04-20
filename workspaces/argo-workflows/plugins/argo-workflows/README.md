# @backstage-community/plugin-argo-workflows

Frontend plugin for viewing Argo Workflows in Backstage. Provides a workflow list table with expandable DAG visualization, full-page DAG view, node detail panel, and status indicators.

## Installation

```bash
yarn --cwd packages/app add @backstage-community/plugin-argo-workflows
```

## Setup (Legacy Frontend System)

```tsx
// packages/app/src/components/catalog/EntityPage.tsx
import { EntityArgoWorkflowsContent } from '@backstage-community/plugin-argo-workflows';

<EntityLayout.Route path="/argo-workflows" title="Argo Workflows">
  <EntityArgoWorkflowsContent />
</EntityLayout.Route>
```

## Setup (New Frontend System)

The plugin supports the new Backstage frontend system via the `alpha` entry point. No manual setup needed — the plugin auto-registers via `EntityContentBlueprint`.

## Full-Page DAG View

Click "Full View ↗" on any inline DAG to open the full-page view at `/argo-workflows/:namespace/:name/dag`. This view provides:
- Zoom in/out and fit-to-view controls
- Minimap for large workflows
- Mouse wheel zoom and click-drag pan
- Collapsible template groups (DAG/Steps/StepGroup)

## i18n Translation Override

All user-facing strings are translatable. To override:

```tsx
import { argoWorkflowsTranslationRef } from '@backstage-community/plugin-argo-workflows';

// In your app, provide custom translations:
const app = createApp({
  __experimentalTranslations: {
    availableLanguages: ['en', 'fr'],
    resources: [
      createTranslationMessages({
        ref: argoWorkflowsTranslationRef,
        messages: {
          // Override any message key
          'nodePanel.phase': 'Phase d\'exécution',
        },
      }),
    ],
  },
});
```

## Entity Annotations

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/kubernetes-namespace: production
    backstage.io/kubernetes-label-selector: app=my-service
```

## Troubleshooting

### "No Argo Workflows annotations found on this entity"
Add `backstage.io/kubernetes-namespace` to your `catalog-info.yaml`.

### "You don't have permission to view Argo Workflows"
The Backstage permission policy is denying `argo-workflows.workflow.read`. Contact your administrator.

### "Access denied" (403)
The Backstage service account needs RBAC permissions. See the [backend README](../argo-workflows-backend/README.md).

### "Unable to connect to the Kubernetes cluster"
Check your Backstage Kubernetes plugin configuration in `app-config.yaml`.

## License

Apache 2.0 — Copyright 2026 The Alithya Authors
