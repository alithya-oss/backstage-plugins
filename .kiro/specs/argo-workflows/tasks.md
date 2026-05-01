# Plan d'implémentation : Plugin Argo Workflows pour Backstage

## Vue d'ensemble

Ce plan décompose la conception du plugin Argo Workflows en tâches de codage incrémentales. Chaque tâche s'appuie sur les précédentes et se termine par le câblage complet des composants. Le plugin suit la convention ADR011 avec quatre packages : common, react, backend et frontend. Le langage d'implémentation est TypeScript.

## Tâches

- [x] 1. Initialiser la structure du workspace et les packages via `yarn new`

  - [x] 1.1 Générer le boilerplate des quatre packages avec `yarn new`

    - Exécuter `yarn new` depuis la racine du projet Backstage pour générer chaque package un par un :
      - Sélectionner "plugin" pour créer `argo-workflows` (frontend-plugin) avec l'id `argo-workflows`
      - Sélectionner "backend-plugin" pour créer `argo-workflows-backend` avec l'id `argo-workflows`
      - Sélectionner "common-plugin-library" pour créer `argo-workflows-common` avec l'id `argo-workflows`
      - Sélectionner "web-library" pour créer `argo-workflows-react` avec l'id `argo-workflows`
    - Les packages seront générés dans `plugins/` avec la structure standard Backstage (package.json, tsconfig.json, src/index.ts)
    - _Exigences : 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 1.2 Ajuster les `package.json` générés pour la conformité ADR011

    - Mettre à jour chaque `package.json` pour ajouter le champ `pluginPackages` listant les quatre packages : `@backstage-community/plugin-argo-workflows`, `@backstage-community/plugin-argo-workflows-backend`, `@backstage-community/plugin-argo-workflows-common`, `@backstage-community/plugin-argo-workflows-react`
    - Vérifier et ajuster le champ `backstage.pluginId` à `argo-workflows` dans chaque package
    - Ajouter les dépendances spécifiques manquantes :
      - `argo-workflows-common` : `@backstage/catalog-model`
      - `argo-workflows-react` : `workspace:^` vers `argo-workflows-common`, `dagre`, `@backstage/ui`
      - `argo-workflows` : `workspace:^` vers `argo-workflows-common` et `argo-workflows-react`, `@backstage/plugin-catalog-react`, `@backstage/ui`, `dagre`
      - `argo-workflows-backend` : `workspace:^` vers `argo-workflows-common`, `express`, `node-fetch`
    - _Exigences : 1.4, 1.5, 1.6, 1.7_

  - [x] 1.3 Nettoyer le boilerplate généré et préparer les fichiers source
    - Supprimer le code d'exemple généré par `yarn new` dans chaque `src/` (composants de démo, routes de démo, etc.)
    - S'assurer que chaque `src/index.ts` est prêt pour les exports réels (vide ou avec les exports de base)
    - Vérifier que les `tsconfig.json` de chaque package étendent correctement la config racine
    - Exécuter `yarn install` pour résoudre les dépendances workspace
    - _Exigences : 1.1, 1.2, 1.3_

- [x] 2. Implémenter le Package Common (`argo-workflows-common`)

  - [x] 2.1 Définir les annotations et la fonction `isArgoWorkflowsAvailable`

    - Créer `src/annotations.ts` exportant `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION` et `ARGO_WORKFLOWS_INSTANCE_ANNOTATION` comme constantes typées
    - Créer `src/utils.ts` exportant `isArgoWorkflowsAvailable(entity: Entity): boolean` qui vérifie la présence et la non-vacuité (après trim) de l'annotation workflow-selector
    - Mettre à jour `src/index.ts` pour réexporter les annotations et utilitaires
    - _Exigences : 1.1, 1.2, 2.1, 2.2, 2.3_

  - [ ]\* 2.2 Écrire le test par propriétés pour `isArgoWorkflowsAvailable`

    - **Propriété 1 : Disponibilité du plugin basée sur les annotations**
    - Générer des entités aléatoires avec/sans annotation, vérifier que le résultat booléen correspond à la présence d'une annotation non vide
    - **Valide : Exigences 2.1, 2.2, 2.3**

  - [x] 2.3 Définir les types TypeScript partagés

    - Créer `src/types.ts` exportant `WorkflowStatus`, `WorkflowMetadata`, `WorkflowNode`, `WorkflowStatusDetail`, `Workflow`, `WorkflowListResponse`
    - Les types doivent correspondre exactement au document de conception
    - Mettre à jour `src/index.ts` pour réexporter les types
    - _Exigences : 1.2, 7.1_

  - [x] 2.4 Implémenter les fonctions de sérialisation `parseWorkflow` et `formatWorkflow`

    - Créer `src/serialization.ts` exportant `parseWorkflow(raw: Record<string, unknown>): Workflow` et `formatWorkflow(workflow: Workflow): Record<string, unknown>`
    - `parseWorkflow` doit valider les champs obligatoires (`metadata.name`, `metadata.namespace`, `status.phase`) et lever une erreur descriptive listant les champs manquants
    - `parseWorkflow` doit ignorer silencieusement les champs inconnus
    - `formatWorkflow` doit produire un JSON conforme au schéma de l'API Argo
    - Mettre à jour `src/index.ts` pour réexporter les fonctions
    - _Exigences : 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]\* 2.5 Écrire le test par propriétés pour le round-trip de sérialisation

    - **Propriété 2 : Round-trip de sérialisation des workflows**
    - Générer des objets Workflow aléatoires, vérifier que `parseWorkflow(formatWorkflow(w))` est équivalent à `w`
    - **Valide : Exigences 7.1, 7.2, 7.3, 7.4**

  - [ ]\* 2.6 Écrire le test par propriétés pour les champs obligatoires manquants
    - **Propriété 3 : Erreur descriptive pour champs obligatoires manquants**
    - Générer des JSON incomplets (manquant au moins un champ parmi `metadata.name`, `metadata.namespace`, `status.phase`), vérifier que l'erreur contient le nom de chaque champ manquant
    - **Valide : Exigence 7.5**

- [x] 3. Point de contrôle — Package Common

  - Vérifier que tous les tests passent pour le package common, demander à l'utilisateur s'il y a des questions.

- [x] 4. Implémenter le Package React (`argo-workflows-react`)

  - [x] 4.1 Implémenter les composants `WorkflowStatusIcon` et `WorkflowStatusBadge`

    - Créer `src/components/WorkflowStatusIcon.tsx` acceptant un `WorkflowStatus` et affichant une icône SVG personnalisée colorée via les tokens CSS de `@backstage/ui` (`--bui-color-success-7` pour Succeeded, `--bui-color-danger-7` pour Failed, `--bui-color-warning-7` pour Running, `--bui-color-neutral-7` pour Pending, `--bui-color-danger-9` pour Error)
    - Ajouter des attributs `aria-label` descriptifs pour chaque statut
    - Ajouter une animation CSS (spinner/pulsation) pour le statut `Running`
    - Créer `src/components/WorkflowStatusBadge.tsx` utilisant les composants BUI `Flex` et `Text` pour afficher le statut sous forme de badge avec icône et libellé textuel
    - Créer `src/components/index.ts` réexportant les composants
    - _Exigences : 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]\* 4.2 Écrire le test par propriétés pour `WorkflowStatusIcon`

    - **Propriété 10 : Complétude et accessibilité de WorkflowStatusIcon**
    - Pour toute valeur valide de `WorkflowStatus`, vérifier que le composant retourne un élément React non nul avec un `aria-label` descriptif et non vide
    - **Valide : Exigences 9.3, 9.4**

  - [x] 4.3 Implémenter la fonction `buildDAG`

    - Créer `src/utils/buildDAG.ts` exportant les interfaces `DAGNode`, `DAGEdge`, `DAGGraph` et la fonction `buildDAG(workflow: Workflow): DAGGraph`
    - `buildDAG` doit créer un nœud pour chaque entrée dans `status.nodes`
    - `buildDAG` doit créer une arête orientée pour chaque relation parent→enfant via le champ `children`
    - `buildDAG` doit détecter les cycles et lever une erreur descriptive
    - Les nœuds sans parent doivent être des nœuds racines (aucune arête entrante)
    - Créer `src/utils/index.ts` réexportant `buildDAG`
    - _Exigences : 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]\* 4.4 Écrire le test par propriétés pour l'invariant du nombre de nœuds du DAG

    - **Propriété 4 : Invariant du nombre de nœuds du DAG**
    - Générer des objets Workflow aléatoires avec `status.nodes`, vérifier que le graphe DAG contient exactement autant de nœuds que d'entrées dans `status.nodes`
    - **Valide : Exigences 8.1, 8.3**

  - [ ]\* 4.5 Écrire le test par propriétés pour la correspondance des arêtes du DAG

    - **Propriété 5 : Correspondance des arêtes du DAG avec les dépendances**
    - Vérifier que chaque relation parent→enfant dans `children` correspond à exactement une arête orientée, et qu'il n'y a aucune arête supplémentaire
    - **Valide : Exigences 8.2, 8.6**

  - [ ]\* 4.6 Écrire le test par propriétés pour la détection de cycles

    - **Propriété 6 : Détection de cycles dans le DAG**
    - Générer des workflows avec des relations `children` contenant des cycles, vérifier que `buildDAG` lève une erreur descriptive
    - **Valide : Exigence 8.4**

  - [ ]\* 4.7 Écrire le test par propriétés pour la validité topologique du DAG

    - **Propriété 7 : Validité topologique du DAG**
    - Pour tout graphe DAG construit à partir d'un workflow acyclique, vérifier qu'un tri topologique est possible sans erreur
    - **Valide : Exigence 8.5**

  - [x] 4.8 Implémenter les hooks `useArgoWorkflows` et `useArgoWorkflowDetail`
    - Créer `src/hooks/useArgoWorkflows.ts` qui appelle `GET /api/argo-workflows/workflows` avec les paramètres `labelSelector` et `instanceName`, retourne `{ workflows, loading, error, retry }`
    - Créer `src/hooks/useArgoWorkflowDetail.ts` qui appelle `GET /api/argo-workflows/workflows/:namespace/:name` avec `instanceName`, retourne `{ workflow, loading, error }`
    - Créer `src/hooks/index.ts` réexportant les hooks
    - Mettre à jour `src/index.ts` pour réexporter composants, hooks, types et utilitaires
    - _Exigences : 3.1, 3.2, 4.1, 4.2, 4.3, 5.1_

- [x] 5. Point de contrôle — Package React

  - Vérifier que tous les tests passent pour le package react, demander à l'utilisateur s'il y a des questions.

- [x] 6. Implémenter le Plugin Backend (`argo-workflows-backend`)

  - [x] 6.1 Implémenter le service `ArgoWorkflowsService`

    - Créer `src/service/ArgoWorkflowsService.ts` avec la classe `ArgoWorkflowsService`
    - Le constructeur lit la configuration `argoWorkflows.instances` depuis `app-config.yaml` et journalise un avertissement si aucune instance n'est configurée
    - Implémenter `listWorkflows(instanceName, labelSelector)` : résout l'instance, valide le labelSelector, appelle l'API Argo `GET /api/v1/workflows?listOptions.labelSelector=...`, applique `parseWorkflow` sur chaque résultat
    - Implémenter `getWorkflow(instanceName, namespace, name)` : résout l'instance, appelle l'API Argo `GET /api/v1/workflows/:namespace/:name`, applique `parseWorkflow`
    - Implémenter la résolution d'instance : utilise `instanceName` si fourni, sinon `defaultInstance`, erreur 404 si l'instance est inconnue, erreur 503 si aucune instance configurée
    - Implémenter la validation du `labelSelector` avec rejet HTTP 400 pour les sélecteurs invalides
    - Gérer les erreurs : 502 si le serveur Argo est injoignable, propagation du code HTTP pour les autres erreurs sans exposer les détails internes
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]\* 6.2 Écrire le test par propriétés pour la validation du labelSelector

    - **Propriété 8 : Validation du sélecteur de labels Kubernetes**
    - Générer des chaînes aléatoires, vérifier que seules les chaînes conformes à la syntaxe `key=value` ou `key in (v1,v2)` sont acceptées
    - **Valide : Exigence 3.6**

  - [x] 6.3 Adapter le routeur Express généré et le plugin backend

    - Modifier `src/router.ts` (généré par `yarn new`) pour configurer les routes :
      - `GET /workflows` : extrait `labelSelector` et `instanceName` des query params, appelle `ArgoWorkflowsService.listWorkflows`
      - `GET /workflows/:namespace/:name` : extrait `instanceName` des query params, appelle `ArgoWorkflowsService.getWorkflow`
    - Modifier `src/plugin.ts` (généré par `yarn new`) pour exporter `argoWorkflowsBackendPlugin` utilisant `createBackendPlugin` avec les dépendances `config`, `httpAuth`, `httpRouter`, `logger`
    - Mettre à jour `src/index.ts` pour exporter le plugin et le routeur
    - _Exigences : 3.1, 3.2, 3.3, 6.1_

  - [ ]\* 6.4 Écrire les tests d'intégration du backend avec supertest
    - Tester `GET /workflows` retourne la liste filtrée
    - Tester `GET /workflows/:namespace/:name` retourne le détail
    - Tester la propagation des erreurs HTTP du serveur Argo
    - Tester l'erreur 502 quand le serveur Argo est injoignable
    - Tester l'erreur 404 pour instance inconnue
    - Tester l'erreur 503 quand aucune instance n'est configurée
    - Tester le routage vers la bonne instance selon `instanceName`
    - Tester l'utilisation de l'instance par défaut quand `instanceName` est absent
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Point de contrôle — Plugin Backend

  - Vérifier que tous les tests passent pour le plugin backend, demander à l'utilisateur s'il y a des questions.

- [x] 8. Implémenter le Plugin Frontend (`argo-workflows`)

  - [x] 8.1 Adapter le plugin généré et créer l'extension `ArgoWorkflowsCI`

    - Modifier `src/plugin.ts` (généré par `yarn new`) pour utiliser `createPlugin({ id: 'argo-workflows' })` et ajouter `ArgoWorkflowsCI` via `createComponentExtension` chargeant le `Router` en lazy
    - Modifier `src/routes.ts` (généré par `yarn new`) pour utiliser `createRouteRef({ id: 'argo-workflows' })`
    - Mettre à jour `src/index.ts` pour exporter `argoWorkflowsPlugin`, `ArgoWorkflowsCI` et `isArgoWorkflowsAvailable` (réexport depuis common)
    - _Exigences : 1.4, 1.8_

  - [x] 8.2 Implémenter le composant `Router`

    - Créer `src/components/Router.tsx` qui utilise `useEntity()` pour lire l'entité, vérifie `isArgoWorkflowsAvailable(entity)`, affiche le contenu si l'annotation est présente, retourne `null` sinon
    - Configurer les routes internes avec `react-router-dom` : route par défaut vers la liste, route de détail vers la vue DAG
    - _Exigences : 2.1, 2.2_

  - [x] 8.3 Implémenter le composant `WorkflowRunsTable`

    - Créer `src/components/WorkflowRunsTable.tsx` utilisant les composants `@backstage/ui` (`Table`, `Flex`, `Text`, `Button`, `Box`, `Card`) pour afficher un tableau avec les colonnes : nom, statut (avec `WorkflowStatusIcon`), durée, date de début
    - Utiliser le hook `useArgoWorkflows` pour charger les données
    - Afficher un skeleton/spinner BUI pendant le chargement
    - Afficher un message d'erreur avec `Button` BUI "Réessayer" en cas d'échec
    - Afficher un message `Text` BUI "Aucune exécution de workflow trouvée" si la liste est vide
    - Trier les workflows par date de début décroissante par défaut
    - Au clic sur une ligne, naviguer vers la vue détaillée du DAG
    - _Exigences : 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]\* 8.4 Écrire le test par propriétés pour le tri des workflows

    - **Propriété 9 : Tri des exécutions par date décroissante**
    - Générer des listes de workflows avec des dates aléatoires, vérifier que le tri produit un ordre décroissant par `status.startedAt`
    - **Valide : Exigence 4.7**

  - [x] 8.5 Implémenter le composant `WorkflowDAGView`

    - Créer `src/components/WorkflowDAGView.tsx` qui utilise `useArgoWorkflowDetail` pour charger le workflow, appelle `buildDAG` pour construire le graphe, utilise `dagre` pour calculer la disposition
    - Rendre le graphe en SVG avec les nœuds colorés selon le statut en utilisant les tokens CSS BUI (`--bui-color-*`) pour garantir la cohérence avec le thème Backstage et le support du mode sombre
    - Afficher un `Tooltip` BUI au survol d'un nœud contenant : nom, statut, durée, dates de début et fin, mis en page avec `Flex` et `Text` BUI
    - Afficher un message `Text` BUI "Ce workflow ne contient pas de tâches" si le workflow n'a aucun nœud
    - Permettre le zoom et le défilement (pan) sur le graphe via des transformations SVG
    - Positionner les nœuds de gauche à droite en respectant l'ordre topologique
    - _Exigences : 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [x] 8.6 Implémenter l'accessibilité du plugin

    - Ajouter des alternatives textuelles pour tous les indicateurs de statut dans le tableau et le DAG
    - Fournir une représentation textuelle alternative accessible du DAG décrivant la liste des nœuds et leurs dépendances (élément `<details>` ou section `sr-only`)
    - Garantir un ratio de contraste minimal de 4.5:1 pour les textes et 3:1 pour les éléments graphiques de statut
    - _Exigences : 10.1, 10.2, 10.3, 10.4_

  - [ ]\* 8.7 Écrire les tests unitaires du plugin frontend
    - Tester l'enregistrement du plugin avec `createPlugin` et id `argo-workflows`
    - Tester que `ArgoWorkflowsCI` est correctement fourni
    - Tester que `Router` affiche le contenu quand l'annotation est présente et retourne null sinon
    - Tester que `WorkflowRunsTable` affiche les colonnes, le skeleton, le message d'erreur avec bouton réessayer, et le message vide
    - Tester que `WorkflowDAGView` affiche le graphe avec les nœuds colorés, le tooltip au survol, et le message pour workflow sans nœuds
    - Tester la navigation du tableau vers la vue DAG au clic
    - _Exigences : 1.8, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.3, 5.4, 5.5_

- [x] 9. Point de contrôle final
  - Vérifier que tous les tests passent pour l'ensemble des packages, demander à l'utilisateur s'il y a des questions.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les points de contrôle assurent une validation incrémentale
- Les tests par propriétés valident les propriétés universelles de correction définies dans le document de conception
- Les tests unitaires valident des scénarios spécifiques et des cas limites
- La bibliothèque de tests par propriétés utilisée est `fast-check`
- Le framework UI utilisé est `@backstage/ui` (BUI) — le design system officiel de Backstage. Les composants de layout (`Flex`, `Box`, `Grid`, `Card`), les composants interactifs (`Button`, `Text`, `Table`, `Tooltip`, `Tag`) et les tokens CSS (`--bui-*`) sont utilisés pour garantir la cohérence visuelle avec le portail Backstage et le support du mode sombre
