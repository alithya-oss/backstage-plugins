---
'@backstage-community/plugin-argo-workflows-common': minor
'@backstage-community/plugin-argo-workflows': minor
'@backstage-community/plugin-argo-workflows-backend': minor
---

Initial release of the Argo Workflows plugin for Backstage.

Features:
- Workflow list table with status badges, filtering, sorting, search, and pagination
- Expandable DAG visualization with horizontal card flow layout
- Node detail panel with metadata grid and error message display
- Node status dots for compact phase summary in table rows
- Polling with state-aware intervals (30s list, 5s running detail)
- Keyboard navigation and screen reader support
- Error boundaries with graceful degradation
- BUI design system with light/dark theme support
