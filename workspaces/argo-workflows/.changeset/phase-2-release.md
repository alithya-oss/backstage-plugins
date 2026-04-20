---
'@alithya-oss/backstage-plugin-argo-workflows-common': minor
'@alithya-oss/backstage-plugin-argo-workflows-react': minor
'@alithya-oss/backstage-plugin-argo-workflows': minor
'@alithya-oss/backstage-plugin-argo-workflows-backend': minor
---

Phase 2 release of the Argo Workflows plugin for Backstage.

New features:
- dagre-powered DAG layout with proper node positioning and SVG edge routing
- Full-page React Flow DAG view with zoom, pan, minimap, and controls
- Compressed nodes decompression with collapsible template groups
- Reusable hooks package (argo-workflows-react) for third-party plugins
- Backstage permission framework integration (argo-workflows.workflow.read)
- New frontend system support (EntityContentBlueprint + ApiBlueprint)
- i18n translation support via argoWorkflowsTranslationRef
