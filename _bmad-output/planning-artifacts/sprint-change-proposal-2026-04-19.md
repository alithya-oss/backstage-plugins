# Sprint Change Proposal: Phase 2

**Date:** 2026-04-19
**Author:** Kiro (with Fjudith)
**Status:** Approved
**Scope:** Major — New epics, new package, new dependencies, architecture updates

## 1. Issue Summary

Phase 1 (Epics 1–4) is complete. All 24 stories are done. The plugin has a working workflow list, CSS flexbox DAG visualization, node detail panel, accessibility, and documentation.

Phase 2 introduces significant enhancements:
- Replace CSS flexbox DAG with `@dagrejs/graphlib` + `dagre` for proper graph layout
- Add React Flow (`@xyflow/react`) for interactive DAG with zoom/pan/minimap
- Decompress nested DAG/Steps/StepGroup templates into collapsible groups
- Extract reusable hooks into `argo-workflows-react` package
- Integrate Backstage permission framework for fine-grained authorization
- Support new Backstage frontend system (`EntityContentBlueprint`)
- Add Backstage i18n (translation) support for all user-facing strings

## 2. Impact Analysis

### Epic Impact

| Epic | Status | Phase 2 Impact |
|------|--------|---------------|
| Epic 1 (Foundation) | Done | New package (`argo-workflows-react`) added |
| Epic 2 (Workflow List) | Done | i18n string extraction |
| Epic 3 (DAG Visualization) | Done | Major rewrite: dagre + React Flow replaces CSS flexbox |
| Epic 4 (Accessibility) | Done | i18n string extraction, React Flow a11y |
| Epic 5 (NEW) | — | dagre layout + React Flow + compressed nodes |
| Epic 6 (NEW) | — | react package + permissions + new frontend system + i18n |

### Artifact Conflicts

| Artifact | Changes Needed |
|----------|---------------|
| Architecture | Add dagre, React Flow, permissions, new frontend system, i18n decisions |
| PRD | Add FR9, FR10 as in-scope; add permission FRs |
| Epics | Add Epic 5 and Epic 6 with new stories |
| UX Design | Add full-page DAG view, collapsible groups, permission-denied state |

### Technical Impact

**New dependencies:**
- `@dagrejs/graphlib` + `dagre` — graph data structure + layout algorithm
- `@xyflow/react` — React Flow v12 for interactive graph rendering
- `@backstage/plugin-permission-common` + `@backstage/plugin-permission-node` — permission framework
- `@backstage/frontend-plugin-api` — new frontend system

**New package:**
- `@backstage-community/plugin-argo-workflows-react` — reusable hooks

## 3. Recommended Approach

**Direct Adjustment** — Add two new epics to the existing sprint plan. No rollback of Phase 1 work needed. The Phase 1 DAG components will be replaced in-place by the dagre + React Flow implementation.

### Epic 5: Advanced DAG Visualization

Replaces the CSS flexbox DAG with dagre layout + React Flow rendering. Adds compressed node decompression and full-page DAG view.

**Stories:**
- 5.1: dagre layout engine — replace `computeDAGColumns` with dagre-based layout
- 5.2: React Flow inline DAG — replace `DAGCardFlow` with React Flow in expanded row
- 5.3: React Flow full-page DAG — new route with zoom, pan, minimap, controls
- 5.4: Compressed nodes decompression — resolve nested DAG/Steps/StepGroup templates
- 5.5: Collapsible group nodes — expand/collapse nested template groups in React Flow

### Epic 6: Platform Integration & i18n

Adds the react hooks package, permission framework, new frontend system, and i18n.

**Stories:**
- 6.1: `argo-workflows-react` package — scaffold and move hooks
- 6.2: Backstage permission framework — define permissions, add backend checks
- 6.3: New frontend system — `EntityContentBlueprint` + `ApiBlueprint`
- 6.4: i18n translation ref — extract strings, create translation catalog
- 6.5: Documentation update — update all READMEs for Phase 2 features

## 4. Detailed Change Proposals

### Architecture Updates

**ADD to Deferred Decisions (mark as now in-scope):**
- ~~Backstage permission framework integration (Phase 3)~~ → Phase 2, Epic 6
- ~~New frontend system support — `EntityContentBlueprint` (Phase 2)~~ → Epic 6
- ~~`argo-workflows-react` package API surface (Phase 2)~~ → Epic 6
- ~~Compressed nodes decompression strategy (Phase 2)~~ → Epic 5

**ADD new architectural decisions:**
- DAG layout: `dagre` for node positioning, `@dagrejs/graphlib` for graph data structure
- DAG rendering: `@xyflow/react` (React Flow v12) for interactive graph canvas
- i18n: `createTranslationRef` from `@backstage/core-plugin-api/alpha`
- Permissions: `@backstage/plugin-permission-common` with entity-scoped conditional permissions

**UPDATE dependency graph:**
```
common ← react ← frontend
common ← backend
```

### PRD Updates

**ADD functional requirements:**
- FR9: Zoom, pan, fit-to-view on DAG (now in-scope)
- FR10: Minimap for large DAGs (now in-scope)
- FR32: Fine-grained permission control for workflow data access
- FR33: i18n support — all user-facing strings translatable
- FR34: New frontend system compatibility

### Epics File Updates

**ADD Epic 5 and Epic 6** with stories as outlined in Section 3.

## 5. Implementation Handoff

**Scope classification:** Major — New epics, new package, new dependencies, architecture updates.

**Handoff:**
1. Update architecture doc with Phase 2 decisions
2. Update PRD with new FRs
3. Add Epic 5 and Epic 6 to epics file
4. Run `sprint-planning` to generate the Phase 2 sprint plan
5. Begin `create-story` → `dev-story` → `code-review` cycle

**Next steps for Fjudith:**
1. Review and approve this proposal
2. Run `bmad-create-architecture` or manually update the architecture doc
3. Run `bmad-create-epics-and-stories` to add Epic 5 and Epic 6
4. Run `bmad-sprint-planning` to generate the Phase 2 sprint status
5. Begin story execution
