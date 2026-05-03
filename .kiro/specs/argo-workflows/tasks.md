# Plan d'implémentation — Plugin Argo Workflows pour Backstage

## Vue d'ensemble

Ce plan décompose la conception du plugin Argo Workflows en tâches de codage incrémentales. Chaque tâche s'appuie sur les précédentes et se termine par le câblage complet des composants. Le plugin suit la convention ADR011 avec quatre packages : common, react, backend et frontend. Le langage d'implémentation est TypeScript. Toutes les tâches sont complétées.

## Tâches

- [x] 1. Initialiser la structure du workspace et les packages via `yarn new`

  - [x] 1.1 Générer le boilerplate des quatre packages avec `yarn new`

    - Exécuter `yarn new` depuis la racine du projet Backstage pour générer chaque package :
      - `argo-workflows` (frontend-plugin), `argo-workflows-backend` (backend-plugin), `argo-workflows-common` (common-library), `argo-workflows-react` (web-library)
    - Les packages sont générés dans `plugins/` avec la structure standard Backstage
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 1.2 Ajuster les `package.json` pour la conformité ADR011

    - Champ `pluginPackages` listant les quatre packages dans chaque `package.json`
    - Champ `backstage.pluginId` à `argo-workflows`
    - Dépendances spécifiques : `@backstage/catalog-model`, `dagre`, `@backstage/ui`, `@remixicon/react`, `@backstage/plugin-kubernetes-node`, `node-fetch`, `express`
    - _Exigences : 1.5, 1.6, 1.7, 1.8_

  - [x] 1.3 Nettoyer le boilerplate et préparer les fichiers source
    - Suppression du code d'exemple, préparation des `src/index.ts` pour les exports réels
    - _Exigences : 1.1, 1.2, 1.3_

- [x] 2. Implémenter le Package Common (`argo-workflows-common`)

  - [x] 2.1 Définir l'enum `ArgoWorkflowsAnnotations` et les constantes dépréciées

    - Créer `src/annotations.ts` exportant l'enum `ArgoWorkflowsAnnotations` avec les membres : `CICD` (`argoworkflows.argoproj.io/workflow`), `LABEL_SELECTOR` (`argoworkflows.argoproj.io/workflow-selector`), `INSTANCE_NAME` (`argoworkflows.argoproj.io/instance-name`), `KUBERNETES_ID` (`backstage.io/kubernetes-id`), `KUBERNETES_NAMESPACE` (`backstage.io/kubernetes-namespace`), `KUBERNETES_LABEL_SELECTOR` (`backstage.io/kubernetes-label-selector`)
    - Exporter les constantes dépréciées `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION` et `ARGO_WORKFLOWS_INSTANCE_ANNOTATION` avec des valeurs identiques aux membres correspondants de l'enum
    - _Exigences : 1.1, 1.2_

  - [x] 2.2 Implémenter la fonction `isArgoWorkflowsAvailable`

    - Créer `src/utils.ts` exportant `isArgoWorkflowsAvailable(entity: Entity): boolean`
    - Retourne `true` si : `CICD` = `"true"`, ou `LABEL_SELECTOR` non vide (après trim), ou `KUBERNETES_LABEL_SELECTOR` non vide, ou `KUBERNETES_ID` non vide
    - Retourne `false` dans tous les autres cas (annotations absentes, vides, whitespace seul, namespace seul)
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.3 Écrire les tests unitaires pour les annotations et `isArgoWorkflowsAvailable`

    - Tests des valeurs de l'enum `ArgoWorkflowsAnnotations` (6 membres)
    - Tests des constantes dépréciées (identiques aux membres de l'enum)
    - Tests de `isArgoWorkflowsAvailable` : CICD="true", CICD="false", CICD vide, LABEL_SELECTOR non vide, LABEL_SELECTOR vide/whitespace, KUBERNETES_LABEL_SELECTOR, KUBERNETES_ID, namespace seul, aucune annotation
    - _Exigences : 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 2.4 Définir les types TypeScript partagés

    - Créer `src/types.ts` exportant `WorkflowStatus`, `WorkflowMetadata`, `WorkflowNode` (avec champ `message`), `WorkflowStatusDetail`, `Workflow`, `WorkflowListResponse`
    - _Exigences : 1.3_

  - [x] 2.5 Implémenter les fonctions de sérialisation `parseWorkflow` et `formatWorkflow`

    - Créer `src/serialization.ts` avec validation des champs obligatoires, parsing des nœuds avec champ `message`, ignorance des champs inconnus
    - _Exigences : 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 2.6 Mettre à jour `src/index.ts` pour réexporter tous les modules
    - Réexporter l'enum, les constantes dépréciées, la fonction utilitaire, les types et les fonctions de sérialisation
    - _Exigences : 1.1, 1.2, 1.3_

- [x] 3. Implémenter le Package React (`argo-workflows-react`)

  - [x] 3.1 Implémenter les composants `WorkflowStatusIcon` et `WorkflowStatusBadge`

    - `WorkflowStatusIcon` : icônes Remix (RiTimeLine, RiLoader4Line, RiCheckboxCircleLine, RiCloseCircleLine, RiErrorWarningLine) colorées via tokens CSS BUI (`--bui-fg-success`, `--bui-fg-danger`, `--bui-fg-info`, `--bui-fg-secondary`)
    - Animation CSS spin pour le statut `Running`
    - Attributs `aria-label` descriptifs pour chaque statut
    - `WorkflowStatusBadge` : badge avec icône et libellé textuel utilisant `Flex` et `Text` BUI
    - _Exigences : 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 3.2 Implémenter la fonction `buildDAG`

    - Créer `src/utils/buildDAG.ts` avec interfaces `DAGNode` (incluant champ `message`), `DAGEdge`, `DAGGraph`
    - `buildDAG(workflow)` : crée un nœud pour chaque entrée dans `status.nodes`, une arête pour chaque relation parent→enfant via `children`
    - Détection de cycles via DFS (coloration WHITE/GRAY/BLACK) avec message descriptif incluant le chemin du cycle
    - _Exigences : 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 3.3 Implémenter le hook `useArgoInstances`

    - Créer `src/hooks/useArgoInstances.ts` qui appelle `GET /api/argo-workflows/instances`
    - Retourne `{ instances: string[], defaultInstance?: string, loading: boolean }`
    - Échec silencieux (le sélecteur ne s'affiche pas si l'endpoint échoue)
    - _Exigences : 7.1_

  - [x] 3.4 Implémenter le hook `useArgoWorkflows` avec support multi-instances

    - Créer `src/hooks/useArgoWorkflows.ts` acceptant `{ labelSelector, instanceName?, instanceNames?, namespace? }`
    - Quand `instanceNames[]` est fourni : récupération parallèle via `Promise.all`, fusion et déduplication par `metadata.uid`
    - Retourne `{ workflows, loading, error, retry }`
    - _Exigences : 7.3, 7.4, 7.5_

  - [x] 3.5 Implémenter le hook `useArgoWorkflowDetail`

    - Créer `src/hooks/useArgoWorkflowDetail.ts` qui appelle `GET /api/argo-workflows/workflows/:namespace/:name`
    - Retourne `{ workflow, loading, error }`
    - _Exigences : 5.2_

  - [x] 3.6 Mettre à jour `src/index.ts` pour réexporter composants, hooks et utilitaires
    - Réexporter `WorkflowStatusIcon`, `WorkflowStatusBadge`, `useArgoWorkflows`, `useArgoWorkflowDetail`, `useArgoInstances`, `buildDAG`, types DAG
    - _Exigences : 1.4_

- [x] 4. Implémenter le Plugin Backend (`argo-workflows-backend`)

  - [x] 4.1 Définir le schéma de configuration `config.d.ts`

    - Déclarer l'interface `Config` avec `argoWorkflows.defaultInstance`, `argoWorkflows.instances[]` supportant `baseUrl`/`token` (Argo API) ou `kubernetes.clusterName` (K8s API), mutuellement exclusifs
    - _Exigences : 6.1, 6.2, 6.3, 6.6_

  - [x] 4.2 Implémenter le service `ArgoWorkflowsService`

    - Créer `src/service/ArgoWorkflowsService.ts` avec la classe `ArgoWorkflowsService`
    - Constructeur : lit la configuration, crée des instances `ArgoApiInstance` ou `KubernetesClusterInstance`, journalise un avertissement si aucune instance
    - Dépendances optionnelles : `KubernetesClustersSupplier`, `KubernetesFetcher`, `AuthenticationStrategy` (requis pour les instances K8s)
    - `getInstanceNames()` : retourne les noms des instances configurées
    - `getDefaultInstance()` : retourne le nom de l'instance par défaut
    - `listWorkflows(instanceName, labelSelector, namespace?, credentials?)` : résout l'instance, valide le labelSelector, route vers Argo API ou K8s API
    - `getWorkflow(instanceName, namespace, name, credentials?)` : résout l'instance, route vers Argo API ou K8s API
    - Chemin Argo API : `GET /api/v1/workflows[/namespace]?listOptions.labelSelector=...` avec Bearer token
    - Chemin K8s : `KubernetesFetcher.fetchObjectsForService` avec CRD `argoproj.io/v1alpha1/workflows`, résolution du cluster via `KubernetesClustersSupplier`, authentification via `AuthenticationStrategy`
    - Validation du labelSelector : syntaxe `key=value`, `key!=value`, `key in (v1,v2)`, `key notin (v1,v2)`, `key`, `!key`, combinaisons par virgule
    - Gestion des erreurs : 502 (serveur injoignable), code propagé (erreur HTTP), 404 (instance/cluster inconnu), 503 (aucune instance/plugin K8s non configuré), 400 (labelSelector invalide/credentials manquantes)
    - _Exigences : 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 4.3 Implémenter le routeur Express et le plugin backend

    - `src/router.ts` : routes `GET /instances`, `GET /workflows`, `GET /workflows/:namespace/:name`
    - `GET /instances` retourne `{ instances: string[], defaultInstance?: string }`
    - `GET /workflows` accepte `labelSelector`, `instanceName`, `namespace` en query params
    - `GET /workflows/:namespace/:name` accepte `instanceName` en query param
    - Mapping des erreurs vers les codes HTTP appropriés (InputError→400, NotFoundError→404, ServiceUnavailableError→503, ForwardedError→502)
    - `src/plugin.ts` : `createBackendPlugin` avec dépendances `config`, `httpAuth`, `httpRouter`, `logger`
    - _Exigences : 5.1, 5.2, 5.3, 5.9_

  - [x] 4.4 Écrire les tests du service backend

    - Tests de `validateLabelSelector` : sélecteurs d'égalité, set-based, existence, combinés, préfixes DNS, vides, invalides
    - Tests du constructeur : avertissement sans config, avertissement sans instances, lecture des instances Argo API, lecture des instances K8s
    - Tests de résolution d'instance : erreur 503 sans instances, erreur 404 instance inconnue, utilisation de l'instance par défaut
    - Tests `listWorkflows` (Argo API) : rejet labelSelector invalide, appel API et parsing, scope par namespace, requête cluster-wide, items null, serveur injoignable (502), propagation erreurs HTTP
    - Tests `getWorkflow` (Argo API) : appel API et parsing, serveur injoignable, propagation erreurs HTTP
    - Tests chemin Kubernetes : listWorkflows via fetcher, propagation namespace, cluster non trouvé, plugin K8s non configuré, credentials manquantes
    - _Exigences : 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5. Implémenter le Plugin Frontend (`argo-workflows`)

  - [x] 5.1 Implémenter le plugin et l'extension `ArgoWorkflowsCI`

    - `src/plugin.ts` : `createPlugin({ id: 'argo-workflows' })` et `ArgoWorkflowsCI` via `createComponentExtension` chargeant le `Router` en lazy
    - _Exigences : 1.9_

  - [x] 5.2 Implémenter le composant `Router`

    - `src/components/Router.tsx` : utilise `useEntity()` et `useArgoInstances()`
    - Vérifie `isArgoWorkflowsAvailable(entity)`, retourne `null` si absent
    - Résolution du labelSelector avec ordre de priorité : `KUBERNETES_LABEL_SELECTOR` > `LABEL_SELECTOR` > `KUBERNETES_ID` (converti en `backstage.io/kubernetes-id=<valeur>`)
    - Lit le namespace depuis `KUBERNETES_NAMESPACE`
    - Lit l'instanceName depuis `INSTANCE_NAME`
    - Passe `availableInstances` au `WorkflowRunsTable`
    - _Exigences : 2.1, 2.5, 3.1, 3.2, 3.3, 4.1_

  - [x] 5.3 Implémenter le composant `WorkflowRunsTable`

    - `src/components/WorkflowRunsTable.tsx` : tableau BUI avec barre d'outils
    - Barre d'outils : titre "Workflows", `Select` multi-instances (quand > 1 instance), `ToggleButtonGroup` pour filtres de statut, `SearchField` pour recherche par nom, horodatage "Updated just now" avec dot vert
    - Colonnes : indicateur d'expansion (RiArrowRightSLine avec rotation 90° via CSS `data-expanded`), nom, namespace, statut (avec `WorkflowStatusIcon`), task status (`TaskStatusBar`), durée, date de début
    - Tri par défaut : date de début décroissante, tri possible par nom, namespace, date
    - Pagination : 5 lignes par défaut, options 5/10/25/50
    - Clic sur une ligne : toggle l'expansion, affiche `WorkflowDAGInline` sous le tableau
    - États : loading (Table BUI loading), erreur (Alert danger avec bouton Retry), vide (Alert info)
    - Utilise `useArgoWorkflows` avec `instanceNames[]` pour la récupération multi-instances
    - _Exigences : 7.2, 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 9.1, 9.2, 9.3_

  - [x] 5.4 Implémenter le composant `TaskStatusBar`

    - `src/components/TaskStatusBar.tsx` : barre horizontale empilée proportionnelle aux statuts des nœuds Pod
    - Tooltip avec les comptages par statut
    - _Exigences : 8.1_

  - [x] 5.5 Implémenter le composant `WorkflowDAGInline`

    - `src/components/WorkflowDAGInline.tsx` : DAG inline affiché sous le tableau
    - Accepte un `Workflow` directement (pas de fetch)
    - Utilise `buildDAG` + `dagre` (rankdir: LR) pour la disposition
    - Rendu SVG avec nœuds colorés par statut, arêtes avec flèches
    - Zoom/pan via transformations SVG (wheel + drag)
    - Contrôles de zoom : `ButtonIcon` avec RiAddLine (zoom in), RiSubtractLine (zoom out), RiFullscreenLine (fit), positionnés en bas à gauche
    - Tooltip au survol : nom, statut, durée
    - Clic sur un nœud : ouvre/ferme le `NodeDetailPanel` latéral
    - Message "This workflow does not contain any tasks" si aucun nœud
    - Accessibilité : `role="img"`, `aria-label`, `role="button"` sur les nœuds, navigation clavier
    - _Exigences : 9.3, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1, 11.2, 11.3_

  - [x] 5.6 Implémenter le composant `WorkflowDAGView`

    - `src/components/WorkflowDAGView.tsx` : vue DAG pleine page avec chargement via `useArgoWorkflowDetail`
    - Mêmes fonctionnalités que `WorkflowDAGInline` (zoom, pan, tooltip, panneau de détail, contrôles de zoom)
    - États : loading (Skeleton), erreur (Alert danger), workflow sans nœuds (Alert info)
    - Représentation textuelle alternative accessible du DAG (élément `<details>` avec liste des nœuds et dépendances)
    - _Exigences : 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1, 11.2, 11.3, 16.2, 16.3_

  - [x] 5.7 Implémenter le composant `NodeDetailPanel`

    - `src/components/NodeDetailPanel.tsx` : panneau de détail d'un nœud DAG
    - En-tête : icône de statut (`WorkflowStatusIcon`) + nom du nœud + bouton fermer (RiCloseLine)
    - Corps : paires clé/valeur en disposition horizontale (inline) avec labels de largeur fixe (5rem) : Type, Duration, Started, Finished
    - Message : encadré stylisé monospace, fond rose (`--bui-bg-danger-subtle`) pour les statuts `Failed` ou `Error`, fond neutre sinon
    - _Exigences : 12.1, 12.2, 12.3_

  - [x] 5.8 Implémenter l'accessibilité du plugin

    - Attributs `aria-label` sur tous les indicateurs de statut, nœuds DAG, contrôles de zoom
    - `role="img"` sur les SVG du DAG avec `aria-label` descriptif
    - `role="button"` et `tabIndex={0}` sur les nœuds DAG pour la navigation clavier
    - `role="tooltip"` sur les tooltips
    - `role="region"` sur le panneau de détail
    - Représentation textuelle alternative du DAG via `<details>` avec `sr-only`
    - Tokens CSS BUI pour les couleurs garantissant le contraste
    - _Exigences : 16.1, 16.2, 16.3, 16.4_

  - [x] 5.9 Créer les fixtures JSON et le fichier d'export

    - 10 fichiers JSON individuels dans `src/__fixtures__/` : succeeded, running, failed, error, pending, lint-check, e2e-tests, docker-build, db-migration, security-scan
    - `src/__fixtures__/workflows.ts` : importe les JSON et exporte les workflows typés
    - `src/__fixtures__/index.ts` : réexporte tous les workflows et la collection `allWorkflows`
    - _Exigences : 17.1, 17.2, 17.3_

  - [x] 5.10 Créer l'application de développement (dev app) multi-instances

    - `dev/index.tsx` : application de développement avec `createDevApp`
    - Entité multi-instances avec annotations CICD et workflow-selector
    - Mock `GET /instances` retournant 3 instances : `argo-server`, `k8s-production`, `k8s-staging`
    - Mock `GET /workflows` retournant des sous-ensembles différents par instance (5 workflows CI/CD pour argo-server, 3 workflows ops pour k8s-production, 2 workflows test pour k8s-staging)
    - Mock `GET /workflows/:namespace/:name` retournant le détail depuis les fixtures
    - _Exigences : 18.1, 18.2, 18.3_

  - [x] 5.11 Créer les fichiers CSS modules

    - `WorkflowRunsTable.module.css` : styles pour la barre d'outils, le dot vert, l'indicateur d'expansion avec rotation, le panneau de détail
    - `WorkflowDAGInline.module.css` : styles pour le conteneur DAG (300px), SVG grab/grabbing, nœuds cliquables, tooltip, contrôles de zoom en bas à gauche
    - `WorkflowDAGView.module.css` : styles pour le conteneur DAG (600px), SVG, nœuds, tooltip, contrôles de zoom, description textuelle sr-only
    - `NodeDetailPanel.module.css` : styles pour le panneau (280-360px), en-tête, corps, lignes horizontales, labels de largeur fixe, encadrés de message (neutre et danger)
    - `TaskStatusBar.module.css` : styles pour la barre empilée et les segments colorés
    - _Exigences : 8.2, 9.2, 11.3, 12.2, 12.3_

## Notes

- Toutes les tâches sont marquées comme complétées car le code est entièrement implémenté
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Le framework UI utilisé est `@backstage/ui` (BUI) avec les icônes Remix (`@remixicon/react`)
- Les tokens CSS BUI (`--bui-*`) garantissent la cohérence visuelle et le support du mode sombre
- Le backend supporte deux sources de données : API Argo Workflows (baseUrl/token) et API Kubernetes via `@backstage/plugin-kubernetes-node`
- Les fixtures de test sont stockées en fichiers JSON individuels pour faciliter la maintenance
- L'application de développement simule 3 instances avec des sous-ensembles de workflows différents
- La bibliothèque de tests par propriétés est `fast-check`
