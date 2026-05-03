# Document d'exigences — Plugin Argo Workflows pour Backstage

## Introduction

Ce document décrit les exigences pour un plugin Backstage communautaire permettant d'intégrer Argo Workflows dans le portail développeur. Le plugin offre aux développeurs une visibilité sur les exécutions de workflows Argo associées à leurs composants du catalogue, ainsi qu'une visualisation interactive du DAG (graphe orienté acyclique) de chaque exécution. L'architecture suit la convention ADR011 de Backstage avec quatre packages : frontend, backend, common et react.

## Glossaire

- **Plugin_Frontend** : Le package principal du plugin (`@alithya-oss/backstage-plugin-argo-workflows`) qui fournit les composants UI intégrés dans le portail Backstage.
- **Plugin_Backend** : Le package backend (`@alithya-oss/backstage-plugin-argo-workflows-backend`) qui sert de proxy API entre Backstage et le serveur Argo Workflows ou l'API Kubernetes.
- **Package_Common** : Le package isomorphe (`@alithya-oss/backstage-plugin-argo-workflows-common`) contenant les modèles partagés, annotations et utilitaires.
- **Package_React** : Le package de widgets React partagés (`@alithya-oss/backstage-plugin-argo-workflows-react`) contenant les hooks, types et composants réutilisables par des plugins tiers.
- **Serveur_Argo** : L'instance du serveur Argo Workflows exposant l'API REST/gRPC pour la gestion des workflows.
- **Entité_Catalogue** : Une entité enregistrée dans le catalogue Backstage (composant, service, etc.) pouvant être associée à des workflows Argo via des annotations.
- **Workflow** : Une ressource CRD Kubernetes Argo Workflows définissant un graphe de tâches/étapes avec leurs dépendances.
- **Noeud_Workflow** : Un nœud individuel dans le DAG d'un workflow, représentant une étape ou une tâche avec son propre statut, message, entrées et sorties.
- **DAG** : Graphe orienté acyclique (Directed Acyclic Graph) représentant la topologie d'un workflow et les dépendances entre ses nœuds.
- **ArgoWorkflowsAnnotations** : L'enum TypeScript exportée par le Package_Common regroupant toutes les clés d'annotations supportées par le plugin.
- **Annotation_CICD** : L'annotation `argoworkflows.argoproj.io/workflow` (valeur `"true"`) servant de porte d'entrée principale pour activer le plugin sur une Entité_Catalogue.
- **Annotation_Workflow** : L'annotation `argoworkflows.argoproj.io/workflow-selector` utilisée pour associer une Entité_Catalogue à des workflows Argo via un sélecteur de labels Kubernetes.
- **Annotation_Instance** : L'annotation `argoworkflows.argoproj.io/instance-name` utilisée pour identifier l'instance du Serveur_Argo à interroger.
- **Annotation_K8s_ID** : L'annotation standard Backstage `backstage.io/kubernetes-id` utilisée pour associer des ressources Kubernetes par label.
- **Annotation_K8s_Namespace** : L'annotation standard Backstage `backstage.io/kubernetes-namespace` utilisée pour limiter les requêtes à un namespace Kubernetes spécifique.
- **Annotation_K8s_Label_Selector** : L'annotation standard Backstage `backstage.io/kubernetes-label-selector` utilisée pour un sélecteur de labels personnalisé (priorité la plus élevée).
- **Statut_Workflow** : L'état d'exécution d'un workflow ou d'un nœud. Les valeurs possibles sont : `Pending`, `Running`, `Succeeded`, `Failed`, `Error`.
- **Instance_Argo** : Une source de données configurée dans `app-config.yaml`, pouvant être soit un serveur Argo Workflows (baseUrl + token), soit un cluster Kubernetes via le plugin Backstage Kubernetes (kubernetes.clusterName).
- **Plugin_Kubernetes** : Le plugin Backstage Kubernetes (`@backstage/plugin-kubernetes-node`) fournissant l'infrastructure pour interroger les clusters Kubernetes configurés.

## Exigences

### Exigence 1 : Structure des packages du plugin

**User Story :** En tant qu'ingénieur plateforme, je veux que le plugin suive la convention ADR011 de Backstage, afin de garantir la cohérence avec l'écosystème des plugins communautaires.

#### Critères d'acceptation

1. THE Package_Common SHALL exporter un enum `ArgoWorkflowsAnnotations` regroupant toutes les clés d'annotations supportées : `CICD`, `LABEL_SELECTOR`, `INSTANCE_NAME`, `KUBERNETES_ID`, `KUBERNETES_NAMESPACE`, `KUBERNETES_LABEL_SELECTOR`.
2. THE Package_Common SHALL exporter les constantes dépréciées `ARGO_WORKFLOWS_LABEL_SELECTOR_ANNOTATION` et `ARGO_WORKFLOWS_INSTANCE_ANNOTATION` pour la rétrocompatibilité, avec des valeurs identiques aux membres correspondants de l'enum `ArgoWorkflowsAnnotations`.
3. THE Package_Common SHALL exporter les types TypeScript partagés pour les modèles Workflow, Noeud_Workflow et Statut_Workflow.
4. THE Package_React SHALL exporter les composants React réutilisables, les hooks et les types pour la visualisation de workflows.
5. THE Plugin_Frontend SHALL déclarer le rôle `frontend-plugin` dans sa configuration backstage avec le pluginId `argo-workflows`.
6. THE Plugin_Backend SHALL déclarer le rôle `backend-plugin` dans sa configuration backstage avec le pluginId `argo-workflows`.
7. THE Package_Common SHALL déclarer le rôle `common-library` dans sa configuration backstage.
8. THE Package_React SHALL déclarer le rôle `web-library` dans sa configuration backstage.
9. WHEN le Plugin_Frontend est enregistré, THE Plugin_Frontend SHALL utiliser `createPlugin` avec l'identifiant `argo-workflows` et fournir un `createComponentExtension` nommé `ArgoWorkflowsCI`.

### Exigence 2 : Association entité-workflows via annotations (stratégie Tekton-style)

**User Story :** En tant que développeur, je veux associer mon composant du catalogue à des workflows Argo via des annotations standard Backstage ou spécifiques au plugin, afin que le plugin affiche automatiquement les workflows pertinents.

#### Critères d'acceptation

1. WHEN une Entité_Catalogue possède l'annotation `argoworkflows.argoproj.io/workflow` avec la valeur `"true"`, THE Plugin_Frontend SHALL considérer le plugin comme disponible pour cette entité.
2. WHEN une Entité_Catalogue possède l'annotation `argoworkflows.argoproj.io/workflow-selector` avec une valeur non vide, THE Plugin_Frontend SHALL considérer le plugin comme disponible pour cette entité.
3. WHEN une Entité_Catalogue possède l'annotation `backstage.io/kubernetes-label-selector` avec une valeur non vide, THE Plugin_Frontend SHALL considérer le plugin comme disponible pour cette entité.
4. WHEN une Entité_Catalogue possède l'annotation `backstage.io/kubernetes-id` avec une valeur non vide, THE Plugin_Frontend SHALL considérer le plugin comme disponible pour cette entité.
5. WHEN aucune des annotations `argoworkflows.argoproj.io/workflow`, `argoworkflows.argoproj.io/workflow-selector`, `backstage.io/kubernetes-label-selector` ou `backstage.io/kubernetes-id` n'est présente ou non vide, THE Plugin_Frontend SHALL masquer l'onglet Argo Workflows pour cette entité.
6. THE Package_Common SHALL exporter une fonction `isArgoWorkflowsAvailable` qui accepte une entité et retourne `true` si au moins une des annotations d'activation est présente et valide.
7. WHEN l'Annotation_Instance est présente sur une Entité_Catalogue, THE Plugin_Backend SHALL utiliser la valeur de cette annotation pour sélectionner l'Instance_Argo à interroger.
8. WHEN l'Annotation_Instance est absente, THE Plugin_Backend SHALL utiliser l'instance par défaut définie dans la configuration `app-config.yaml`.

### Exigence 3 : Résolution du sélecteur de labels avec ordre de priorité

**User Story :** En tant que développeur, je veux que le plugin résolve le sélecteur de labels selon un ordre de priorité clair, afin de pouvoir utiliser les annotations standard Backstage ou les annotations spécifiques au plugin de manière cohérente.

#### Critères d'acceptation

1. WHEN l'annotation `backstage.io/kubernetes-label-selector` est présente, THE Plugin_Frontend SHALL utiliser sa valeur comme sélecteur de labels (priorité la plus élevée).
2. WHEN l'annotation `backstage.io/kubernetes-label-selector` est absente et l'annotation `argoworkflows.argoproj.io/workflow-selector` est présente, THE Plugin_Frontend SHALL utiliser sa valeur comme sélecteur de labels.
3. WHEN les annotations `backstage.io/kubernetes-label-selector` et `argoworkflows.argoproj.io/workflow-selector` sont absentes et l'annotation `backstage.io/kubernetes-id` est présente, THE Plugin_Frontend SHALL construire un sélecteur de labels sous la forme `backstage.io/kubernetes-id=<valeur>`.
4. THE Plugin_Frontend SHALL transmettre le sélecteur de labels résolu au Plugin_Backend pour filtrer les workflows.

### Exigence 4 : Requêtes scopées par namespace

**User Story :** En tant que développeur, je veux pouvoir limiter les requêtes de workflows à un namespace Kubernetes spécifique, afin de ne voir que les workflows pertinents pour mon composant.

#### Critères d'acceptation

1. WHEN l'annotation `backstage.io/kubernetes-namespace` est présente sur une Entité_Catalogue, THE Plugin_Frontend SHALL transmettre la valeur du namespace au Plugin_Backend pour limiter les requêtes à ce namespace.
2. WHEN l'annotation `backstage.io/kubernetes-namespace` est absente, THE Plugin_Backend SHALL effectuer des requêtes à l'échelle du cluster (cluster-wide).
3. THE Plugin_Backend SHALL accepter un paramètre optionnel `namespace` dans les endpoints de liste et de détail des workflows.

### Exigence 5 : Proxy backend vers le serveur Argo Workflows et l'API Kubernetes

**User Story :** En tant qu'ingénieur plateforme, je veux que le plugin backend serve de proxy sécurisé vers l'API Argo Workflows ou l'API Kubernetes, afin que les credentials ne soient pas exposées au frontend.

#### Critères d'acceptation

1. THE Plugin_Backend SHALL exposer un endpoint REST `GET /api/argo-workflows/workflows` qui retourne la liste des workflows filtrés par le sélecteur de labels fourni.
2. THE Plugin_Backend SHALL exposer un endpoint REST `GET /api/argo-workflows/workflows/:namespace/:name` qui retourne le détail complet d'un workflow incluant la topologie du DAG et le statut de chaque Noeud_Workflow.
3. THE Plugin_Backend SHALL exposer un endpoint REST `GET /api/argo-workflows/instances` qui retourne la liste des noms d'instances configurées et le nom de l'instance par défaut.
4. WHEN une Instance_Argo est configurée avec `baseUrl` et `token`, THE Plugin_Backend SHALL transmettre les requêtes au Serveur_Argo en ajoutant les credentials d'authentification.
5. WHEN une Instance_Argo est configurée avec `kubernetes.clusterName`, THE Plugin_Backend SHALL interroger les CRDs Workflow (`argoproj.io/v1alpha1/workflows`) via l'infrastructure du Plugin_Kubernetes en utilisant `KubernetesClustersSupplier`, `KubernetesFetcher` et `AuthenticationStrategy`.
6. IF le Serveur_Argo retourne une erreur HTTP, THEN THE Plugin_Backend SHALL propager le code d'erreur et un message descriptif au frontend sans exposer les détails internes du serveur.
7. IF le Serveur_Argo est injoignable, THEN THE Plugin_Backend SHALL retourner une erreur HTTP 502 avec un message indiquant que le serveur est indisponible.
8. THE Plugin_Backend SHALL valider que le paramètre `labelSelector` est une chaîne de sélecteur Kubernetes valide avant de transmettre la requête.
9. WHEN la configuration `app-config.yaml` contient plusieurs instances, THE Plugin_Backend SHALL router la requête vers l'instance correspondant au paramètre `instanceName` de la requête.

### Exigence 6 : Configuration du plugin avec support multi-source

**User Story :** En tant qu'ingénieur plateforme, je veux configurer le plugin via `app-config.yaml` avec des instances utilisant soit l'API Argo Workflows soit l'API Kubernetes, afin de connecter le plugin à différentes sources de données.

#### Critères d'acceptation

1. THE Plugin_Backend SHALL lire la configuration des instances depuis la clé `argoWorkflows.instances` dans `app-config.yaml`.
2. WHEN une instance est configurée avec `baseUrl` et `token`, THE Plugin_Backend SHALL l'utiliser comme source de données via l'API Argo Workflows (les propriétés `baseUrl` et `token` sont mutuellement exclusives avec `kubernetes`).
3. WHEN une instance est configurée avec `kubernetes.clusterName`, THE Plugin_Backend SHALL l'utiliser comme source de données via l'API Kubernetes en résolvant le cluster depuis la configuration du Plugin_Kubernetes.
4. IF la configuration ne contient aucune instance, THEN THE Plugin_Backend SHALL journaliser un avertissement au démarrage et retourner une erreur HTTP 503 pour toute requête.
5. IF une instance référencée par `instanceName` n'existe pas dans la configuration, THEN THE Plugin_Backend SHALL retourner une erreur HTTP 404 avec un message indiquant que l'instance est inconnue.
6. THE Plugin_Backend SHALL accepter une propriété optionnelle `defaultInstance` dans la configuration `argoWorkflows` pour spécifier l'instance à utiliser lorsque l'Annotation_Instance est absente.

### Exigence 7 : Sélecteur d'instances dans l'interface

**User Story :** En tant que développeur, je veux pouvoir sélectionner une ou plusieurs instances Argo Workflows dans l'interface, afin de consulter les workflows provenant de différentes sources de données.

#### Critères d'acceptation

1. THE Package_React SHALL exporter un hook `useArgoInstances` qui appelle `GET /api/argo-workflows/instances` et retourne la liste des noms d'instances et l'instance par défaut.
2. WHEN plusieurs instances sont disponibles, THE Plugin_Frontend SHALL afficher un sélecteur multi-instances (dropdown multi-select) dans la barre d'outils du tableau.
3. WHEN l'utilisateur sélectionne plusieurs instances, THE Plugin_Frontend SHALL récupérer les workflows de chaque instance en parallèle et fusionner les résultats.
4. THE Package_React SHALL dédupliquer les workflows fusionnés par leur `metadata.uid` pour éviter les doublons.
5. THE Package_React SHALL exporter un hook `useArgoWorkflows` acceptant un paramètre optionnel `instanceNames?: string[]` pour la récupération parallèle multi-instances.

### Exigence 8 : Liste des exécutions de workflows avec barre d'outils

**User Story :** En tant que développeur, je veux voir la liste des exécutions de workflows avec des outils de filtrage et de recherche, afin de suivre efficacement l'état de mes pipelines CI/CD.

#### Critères d'acceptation

1. WHEN l'onglet Argo Workflows est affiché pour une Entité_Catalogue, THE Plugin_Frontend SHALL afficher un tableau listant les exécutions de workflows avec les colonnes : indicateur d'expansion, nom, namespace, statut, statut des tâches, durée, date de début.
2. THE Plugin_Frontend SHALL afficher une barre d'outils au-dessus du tableau contenant : le titre "Workflows" à gauche, le sélecteur d'instances, les filtres de statut, le champ de recherche et l'horodatage de mise à jour à droite.
3. THE Plugin_Frontend SHALL afficher des boutons de filtre par statut (`Succeeded`, `Failed`, `Running`, `Pending`, `Error`) sous forme de `ToggleButtonGroup` permettant la sélection multiple.
4. THE Plugin_Frontend SHALL afficher un champ de recherche permettant de filtrer les workflows par nom.
5. THE Plugin_Frontend SHALL afficher un horodatage "Updated just now" avec un indicateur vert (dot) indiquant la fraîcheur des données.
6. THE Plugin_Frontend SHALL utiliser une taille de page par défaut de 5 lignes avec des options de pagination (5, 10, 25, 50).
7. WHEN les données de workflows sont en cours de chargement, THE Plugin_Frontend SHALL afficher un indicateur de chargement.
8. IF le chargement des workflows échoue, THEN THE Plugin_Frontend SHALL afficher un message d'erreur explicite avec la possibilité de réessayer.
9. WHEN la liste de workflows est vide, THE Plugin_Frontend SHALL afficher un message indiquant qu'aucune exécution de workflow n'a été trouvée pour ce composant.
10. THE Plugin_Frontend SHALL afficher le Statut_Workflow de chaque exécution avec une icône et une couleur distinctes : vert pour `Succeeded`, rouge pour `Failed`, orange pour `Running`, gris pour `Pending`, rouge foncé pour `Error`.
11. THE Plugin_Frontend SHALL trier les exécutions par date de début décroissante par défaut.
12. THE Plugin_Frontend SHALL permettre le tri par nom, namespace et date de début.

### Exigence 9 : Indicateur d'expansion des lignes du tableau

**User Story :** En tant que développeur, je veux un indicateur visuel clair pour savoir quelles lignes du tableau sont expansibles, afin de pouvoir explorer les détails d'un workflow.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL afficher une icône flèche (RiArrowRightSLine de Remix) dans la première colonne de chaque ligne du tableau.
2. WHEN une ligne est sélectionnée et le DAG est affiché, THE Plugin_Frontend SHALL faire pivoter l'icône flèche de 90° via une transition CSS.
3. WHEN un utilisateur clique sur une ligne du tableau, THE Plugin_Frontend SHALL afficher la vue DAG inline en dessous du tableau pour cette exécution de workflow.

### Exigence 10 : Visualisation du DAG d'un workflow

**User Story :** En tant que développeur, je veux visualiser le graphe DAG d'une exécution de workflow, afin de comprendre les dépendances entre les étapes et identifier les points de défaillance.

#### Critères d'acceptation

1. WHEN un workflow est sélectionné, THE Plugin_Frontend SHALL afficher un graphe DAG interactif représentant les nœuds du workflow et leurs dépendances sous forme d'arêtes orientées.
2. THE Plugin_Frontend SHALL utiliser la bibliothèque `dagre` pour calculer la disposition automatique des nœuds du DAG.
3. WHEN le DAG est affiché, THE Plugin_Frontend SHALL colorier chaque Noeud_Workflow selon son Statut_Workflow en utilisant le même code couleur que la liste des exécutions.
4. WHEN un utilisateur survole un Noeud_Workflow dans le DAG, THE Plugin_Frontend SHALL afficher un tooltip contenant le nom du nœud, son statut et sa durée d'exécution.
5. IF un workflow ne contient aucun nœud, THEN THE Plugin_Frontend SHALL afficher un message indiquant que le workflow ne contient pas de tâches.
6. THE Plugin_Frontend SHALL permettre le zoom et le défilement (pan) sur le graphe DAG pour les workflows comportant un grand nombre de nœuds.
7. WHEN le DAG est rendu, THE Plugin_Frontend SHALL positionner les nœuds de gauche à droite en respectant l'ordre topologique des dépendances.

### Exigence 11 : Contrôles de zoom du DAG

**User Story :** En tant que développeur, je veux des contrôles de zoom dédiés sur la vue DAG, afin de naviguer facilement dans les graphes complexes.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL afficher des boutons de zoom in, zoom out et fit-to-view dans les composants DAGInline et DAGView.
2. THE Plugin_Frontend SHALL utiliser les icônes Remix (RiAddLine, RiSubtractLine, RiFullscreenLine) pour les boutons de zoom.
3. THE Plugin_Frontend SHALL positionner les contrôles de zoom en bas à gauche du conteneur DAG.

### Exigence 12 : Panneau de détail des nœuds du DAG

**User Story :** En tant que développeur, je veux voir les détails d'un nœud du DAG lorsque je clique dessus, afin de comprendre l'état et les messages d'erreur de chaque étape.

#### Critères d'acceptation

1. WHEN un utilisateur clique sur un Noeud_Workflow dans le DAG, THE Plugin_Frontend SHALL afficher un panneau de détail à côté du graphe contenant : le nom du nœud avec son icône de statut, le type, la durée, les dates de début et fin.
2. WHEN le Noeud_Workflow possède un champ `message`, THE Plugin_Frontend SHALL afficher le message dans un encadré stylisé (monospace, fond rose pour les statuts `Failed` ou `Error`).
3. THE Plugin_Frontend SHALL afficher les paires clé/valeur du panneau de détail en disposition horizontale (inline) avec des labels de largeur fixe pour l'alignement.
4. THE Package_React SHALL inclure le champ `message` dans l'interface `DAGNode` et la fonction `buildDAG`.

### Exigence 13 : Construction du graphe DAG à partir des données de workflow

**User Story :** En tant que développeur du plugin, je veux que la construction du graphe DAG soit fiable et correcte, afin que la visualisation reflète fidèlement la topologie du workflow.

#### Critères d'acceptation

1. WHEN un objet Workflow est fourni, THE Package_React SHALL construire un graphe DAG contenant un nœud pour chaque Noeud_Workflow présent dans `status.nodes`.
2. WHEN un Noeud_Workflow déclare des dépendances via le champ `children`, THE Package_React SHALL créer une arête orientée du nœud parent vers chaque nœud enfant.
3. FOR ALL graphes DAG construits, le nombre de nœuds dans le graphe SHALL être égal au nombre de Noeud_Workflow dans `status.nodes` (propriété d'invariant).
4. IF les dépendances d'un workflow contiennent un cycle, THEN THE Package_React SHALL détecter le cycle et retourner une erreur descriptive au lieu de produire un graphe invalide.
5. FOR ALL graphes DAG construits à partir de workflows valides, un tri topologique du graphe SHALL être possible sans erreur (propriété de validité du DAG).
6. WHEN un Noeud_Workflow n'a aucune dépendance, THE Package_React SHALL le positionner comme nœud racine (sans arête entrante) dans le graphe.

### Exigence 14 : Sérialisation et désérialisation des modèles de workflow

**User Story :** En tant que développeur du plugin, je veux que les modèles de workflow soient correctement sérialisés et désérialisés entre le backend et le frontend, afin de garantir l'intégrité des données.

#### Critères d'acceptation

1. THE Package_Common SHALL exporter une fonction `parseWorkflow` qui transforme une réponse JSON brute de l'API Argo en un objet Workflow typé.
2. THE Package_Common SHALL exporter une fonction `formatWorkflow` qui transforme un objet Workflow typé en une représentation JSON conforme au schéma de l'API Argo.
3. FOR ALL objets Workflow valides, l'application successive de `parseWorkflow` puis `formatWorkflow` puis `parseWorkflow` SHALL produire un objet équivalent à l'objet initial (propriété de round-trip).
4. WHEN la réponse JSON contient des champs inconnus, THE `parseWorkflow` SHALL ignorer ces champs sans générer d'erreur.
5. IF la réponse JSON ne contient pas les champs obligatoires (`metadata.name`, `metadata.namespace`, `status.phase`), THEN THE `parseWorkflow` SHALL retourner une erreur descriptive indiquant les champs manquants.

### Exigence 15 : Indicateurs de statut visuels

**User Story :** En tant que développeur, je veux des indicateurs visuels clairs pour les statuts de workflows et de nœuds, afin de comprendre rapidement l'état de mes exécutions.

#### Critères d'acceptation

1. THE Package_React SHALL exporter un composant `WorkflowStatusIcon` qui accepte un Statut_Workflow et affiche l'icône et la couleur correspondantes.
2. THE Package_React SHALL exporter un composant `WorkflowStatusBadge` qui affiche le statut sous forme de badge avec icône et libellé textuel.
3. FOR ALL valeurs possibles de Statut_Workflow (`Pending`, `Running`, `Succeeded`, `Failed`, `Error`), THE `WorkflowStatusIcon` SHALL retourner un élément React valide et non nul.
4. THE `WorkflowStatusIcon` SHALL utiliser des attributs `aria-label` descriptifs pour chaque statut afin de garantir l'accessibilité.
5. WHEN le statut est `Running`, THE `WorkflowStatusIcon` SHALL afficher une animation visuelle (spinner ou pulsation) pour indiquer une exécution en cours.

### Exigence 16 : Accessibilité

**User Story :** En tant que développeur utilisant des technologies d'assistance, je veux que le plugin soit accessible, afin de pouvoir consulter les informations de workflows sans barrière.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL respecter les critères WCAG 2.1 niveau AA pour tous les composants visuels.
2. THE Plugin_Frontend SHALL fournir des alternatives textuelles pour tous les indicateurs de statut visuels dans le tableau et le DAG.
3. WHEN le graphe DAG est affiché, THE Plugin_Frontend SHALL fournir une représentation textuelle alternative accessible décrivant la liste des nœuds et leurs dépendances.
4. THE Plugin_Frontend SHALL garantir un ratio de contraste minimal de 4.5:1 pour tous les textes et de 3:1 pour les éléments graphiques de statut.

### Exigence 17 : Fixtures de test en JSON

**User Story :** En tant que développeur du plugin, je veux que les fixtures de test soient stockées en fichiers JSON individuels, afin de faciliter la maintenance et la lisibilité des données de test.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL stocker les fixtures de workflows sous forme de fichiers JSON individuels dans le répertoire `src/__fixtures__/`.
2. THE Plugin_Frontend SHALL fournir au minimum 10 fixtures couvrant tous les statuts possibles (`Succeeded`, `Failed`, `Running`, `Pending`, `Error`) et différents scénarios (lint, e2e, docker build, migration, security scan).
3. THE Plugin_Frontend SHALL exporter les fixtures via un fichier `index.ts` pour une utilisation dans les tests et l'application de développement.

### Exigence 18 : Application de développement (dev app)

**User Story :** En tant que développeur du plugin, je veux une application de développement fonctionnelle avec des données simulées, afin de pouvoir tester le plugin sans infrastructure Argo Workflows réelle.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL fournir une application de développement avec une page "Workflows" utilisant une entité multi-instances.
2. THE Plugin_Frontend SHALL simuler un endpoint `GET /instances` retournant 3 instances configurées.
3. THE Plugin_Frontend SHALL retourner des sous-ensembles de workflows différents selon l'instance interrogée dans les données simulées.
