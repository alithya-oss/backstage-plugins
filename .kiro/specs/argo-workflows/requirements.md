# Document d'exigences — Plugin Argo Workflows pour Backstage

## Introduction

Ce document décrit les exigences pour un plugin Backstage communautaire permettant d'intégrer Argo Workflows dans le portail développeur. Le plugin offre aux développeurs une visibilité sur les exécutions de workflows Argo associées à leurs composants du catalogue, ainsi qu'une visualisation interactive du DAG (graphe orienté acyclique) de chaque exécution. L'architecture suit la convention ADR011 de Backstage avec quatre packages : frontend, backend, common et react.

## Glossaire

- **Plugin_Frontend** : Le package principal du plugin (`@backstage-community/plugin-argo-workflows`) qui fournit les composants UI intégrés dans le portail Backstage.
- **Plugin_Backend** : Le package backend (`@backstage-community/plugin-argo-workflows-backend`) qui sert de proxy API entre Backstage et le serveur Argo Workflows.
- **Package_Common** : Le package isomorphe (`@backstage-community/plugin-argo-workflows-common`) contenant les modèles partagés, annotations et utilitaires.
- **Package_React** : Le package de widgets React partagés (`@backstage-community/plugin-argo-workflows-react`) contenant les hooks, types et composants réutilisables par des plugins tiers.
- **Serveur_Argo** : L'instance du serveur Argo Workflows exposant l'API REST/gRPC pour la gestion des workflows.
- **Entité_Catalogue** : Une entité enregistrée dans le catalogue Backstage (composant, service, etc.) pouvant être associée à des workflows Argo via des annotations.
- **Workflow** : Une ressource CRD Kubernetes Argo Workflows définissant un graphe de tâches/étapes avec leurs dépendances.
- **Noeud_Workflow** : Un nœud individuel dans le DAG d'un workflow, représentant une étape ou une tâche avec son propre statut, logs, entrées et sorties.
- **DAG** : Graphe orienté acyclique (Directed Acyclic Graph) représentant la topologie d'un workflow et les dépendances entre ses nœuds.
- **Annotation_Workflow** : L'annotation Backstage `argoworkflows.argoproj.io/workflow-selector` utilisée pour associer une Entité_Catalogue à des workflows Argo via un sélecteur de labels Kubernetes.
- **Annotation_Instance** : L'annotation Backstage `argoworkflows.argoproj.io/instance-name` utilisée pour identifier l'instance du Serveur_Argo à interroger.
- **Statut_Workflow** : L'état d'exécution d'un workflow ou d'un nœud. Les valeurs possibles sont : `Pending`, `Running`, `Succeeded`, `Failed`, `Error`.

## Exigences

### Exigence 1 : Structure des packages du plugin

**User Story :** En tant qu'ingénieur plateforme, je veux que le plugin suive la convention ADR011 de Backstage, afin de garantir la cohérence avec l'écosystème des plugins communautaires.

#### Critères d'acceptation

1. THE Package_Common SHALL exporter les annotations `Annotation_Workflow` et `Annotation_Instance` en tant que constantes typées.
2. THE Package_Common SHALL exporter les types TypeScript partagés pour les modèles Workflow, Noeud_Workflow et Statut_Workflow.
3. THE Package_React SHALL exporter les composants React réutilisables, les hooks et les types pour la visualisation de workflows.
4. THE Plugin_Frontend SHALL déclarer le rôle `frontend-plugin` dans sa configuration backstage avec le pluginId `argo-workflows`.
5. THE Plugin_Backend SHALL déclarer le rôle `backend-plugin` dans sa configuration backstage avec le pluginId `argo-workflows`.
6. THE Package_Common SHALL déclarer le rôle `common-library` dans sa configuration backstage.
7. THE Package_React SHALL déclarer le rôle `web-library` dans sa configuration backstage.
8. WHEN le Plugin_Frontend est enregistré, THE Plugin_Frontend SHALL utiliser `createPlugin` avec l'identifiant `argo-workflows` et fournir un `createComponentExtension` nommé `ArgoWorkflowsCI`.

### Exigence 2 : Association entité-workflows via annotations

**User Story :** En tant que développeur, je veux associer mon composant du catalogue à des workflows Argo via une annotation, afin que le plugin affiche automatiquement les workflows pertinents.

#### Critères d'acceptation

1. WHEN une Entité_Catalogue possède l'annotation `argoworkflows.argoproj.io/workflow-selector` avec une valeur non vide, THE Plugin_Frontend SHALL considérer le plugin comme disponible pour cette entité.
2. WHEN une Entité_Catalogue ne possède pas l'annotation `argoworkflows.argoproj.io/workflow-selector`, THE Plugin_Frontend SHALL masquer l'onglet Argo Workflows pour cette entité.
3. THE Package_Common SHALL exporter une fonction `isArgoWorkflowsAvailable` qui accepte une entité et retourne `true` si l'Annotation_Workflow est présente et non vide.
4. WHEN l'Annotation_Instance est présente sur une Entité_Catalogue, THE Plugin_Backend SHALL utiliser la valeur de cette annotation pour sélectionner l'instance du Serveur_Argo à interroger.
5. WHEN l'Annotation_Instance est absente, THE Plugin_Backend SHALL utiliser l'instance par défaut définie dans la configuration `app-config.yaml`.

### Exigence 3 : Proxy backend vers le serveur Argo Workflows

**User Story :** En tant qu'ingénieur plateforme, je veux que le plugin backend serve de proxy sécurisé vers l'API Argo Workflows, afin que les credentials du serveur Argo ne soient pas exposées au frontend.

#### Critères d'acceptation

1. THE Plugin_Backend SHALL exposer un endpoint REST `GET /api/argo-workflows/workflows` qui retourne la liste des workflows filtrés par le sélecteur de labels fourni.
2. THE Plugin_Backend SHALL exposer un endpoint REST `GET /api/argo-workflows/workflows/:namespace/:name` qui retourne le détail complet d'un workflow incluant la topologie du DAG et le statut de chaque Noeud_Workflow.
3. WHEN le Plugin_Backend reçoit une requête, THE Plugin_Backend SHALL transmettre la requête au Serveur_Argo en ajoutant les credentials d'authentification configurés dans `app-config.yaml`.
4. IF le Serveur_Argo retourne une erreur HTTP, THEN THE Plugin_Backend SHALL propager le code d'erreur et un message descriptif au frontend sans exposer les détails internes du serveur.
5. IF le Serveur_Argo est injoignable, THEN THE Plugin_Backend SHALL retourner une erreur HTTP 502 avec un message indiquant que le serveur Argo Workflows est indisponible.
6. THE Plugin_Backend SHALL valider que le paramètre `labelSelector` est une chaîne de sélecteur Kubernetes valide avant de transmettre la requête au Serveur_Argo.
7. WHEN la configuration `app-config.yaml` contient plusieurs instances Argo Workflows, THE Plugin_Backend SHALL router la requête vers l'instance correspondant au paramètre `instanceName` de la requête.

### Exigence 4 : Liste des exécutions de workflows

**User Story :** En tant que développeur, je veux voir la liste des exécutions de workflows associées à mon composant, afin de suivre l'état de mes pipelines CI/CD.

#### Critères d'acceptation

1. WHEN l'onglet Argo Workflows est affiché pour une Entité_Catalogue, THE Plugin_Frontend SHALL afficher un tableau listant les exécutions de workflows avec les colonnes : nom, statut, durée, date de début.
2. WHEN les données de workflows sont en cours de chargement, THE Plugin_Frontend SHALL afficher un indicateur de chargement (skeleton ou spinner).
3. IF le chargement des workflows échoue, THEN THE Plugin_Frontend SHALL afficher un message d'erreur explicite avec la possibilité de réessayer.
4. WHEN la liste de workflows est vide, THE Plugin_Frontend SHALL afficher un message indiquant qu'aucune exécution de workflow n'a été trouvée pour ce composant.
5. THE Plugin_Frontend SHALL afficher le Statut_Workflow de chaque exécution avec une icône et une couleur distinctes : vert pour `Succeeded`, rouge pour `Failed`, orange pour `Running`, gris pour `Pending`, rouge foncé pour `Error`.
6. WHEN un utilisateur clique sur une ligne du tableau, THE Plugin_Frontend SHALL afficher la vue détaillée du DAG pour cette exécution de workflow.
7. THE Plugin_Frontend SHALL trier les exécutions par date de début décroissante par défaut.

### Exigence 5 : Visualisation du DAG d'un workflow

**User Story :** En tant que développeur, je veux visualiser le graphe DAG d'une exécution de workflow, afin de comprendre les dépendances entre les étapes et identifier les points de défaillance.

#### Critères d'acceptation

1. WHEN un workflow est sélectionné, THE Plugin_Frontend SHALL afficher un graphe DAG interactif représentant les nœuds du workflow et leurs dépendances sous forme d'arêtes orientées.
2. THE Plugin_Frontend SHALL utiliser la bibliothèque `dagre` pour calculer la disposition automatique des nœuds du DAG.
3. WHEN le DAG est affiché, THE Plugin_Frontend SHALL colorier chaque Noeud_Workflow selon son Statut_Workflow en utilisant le même code couleur que la liste des exécutions.
4. WHEN un utilisateur survole un Noeud_Workflow dans le DAG, THE Plugin_Frontend SHALL afficher un tooltip contenant le nom du nœud, son statut, sa durée d'exécution et ses dates de début et fin.
5. IF un workflow ne contient aucun nœud, THEN THE Plugin_Frontend SHALL afficher un message indiquant que le workflow ne contient pas de tâches.
6. THE Plugin_Frontend SHALL permettre le zoom et le défilement (pan) sur le graphe DAG pour les workflows comportant un grand nombre de nœuds.
7. WHEN le DAG est rendu, THE Plugin_Frontend SHALL positionner les nœuds de gauche à droite en respectant l'ordre topologique des dépendances.

### Exigence 6 : Configuration du plugin

**User Story :** En tant qu'ingénieur plateforme, je veux configurer le plugin via `app-config.yaml`, afin de connecter le plugin à une ou plusieurs instances du serveur Argo Workflows.

#### Critères d'acceptation

1. THE Plugin_Backend SHALL lire la configuration des instances Argo Workflows depuis la clé `argoWorkflows.instances` dans `app-config.yaml`.
2. WHEN une instance est configurée, THE Plugin_Backend SHALL accepter les propriétés suivantes : `name` (identifiant unique), `baseUrl` (URL du Serveur_Argo), et `token` (jeton d'authentification).
3. IF la configuration ne contient aucune instance, THEN THE Plugin_Backend SHALL journaliser un avertissement au démarrage et retourner une erreur HTTP 503 pour toute requête.
4. IF une instance référencée par `instanceName` n'existe pas dans la configuration, THEN THE Plugin_Backend SHALL retourner une erreur HTTP 404 avec un message indiquant que l'instance est inconnue.
5. THE Plugin_Backend SHALL accepter une propriété optionnelle `defaultInstance` dans la configuration `argoWorkflows` pour spécifier l'instance à utiliser lorsque l'Annotation_Instance est absente.

### Exigence 7 : Sérialisation et désérialisation des modèles de workflow

**User Story :** En tant que développeur du plugin, je veux que les modèles de workflow soient correctement sérialisés et désérialisés entre le backend et le frontend, afin de garantir l'intégrité des données.

#### Critères d'acceptation

1. THE Package_Common SHALL exporter une fonction `parseWorkflow` qui transforme une réponse JSON brute de l'API Argo en un objet Workflow typé.
2. THE Package_Common SHALL exporter une fonction `formatWorkflow` qui transforme un objet Workflow typé en une représentation JSON conforme au schéma de l'API Argo.
3. FOR ALL objets Workflow valides, l'application successive de `parseWorkflow` puis `formatWorkflow` puis `parseWorkflow` SHALL produire un objet équivalent à l'objet initial (propriété de round-trip).
4. WHEN la réponse JSON contient des champs inconnus, THE `parseWorkflow` SHALL ignorer ces champs sans générer d'erreur.
5. IF la réponse JSON ne contient pas les champs obligatoires (`metadata.name`, `metadata.namespace`, `status.phase`), THEN THE `parseWorkflow` SHALL retourner une erreur descriptive indiquant les champs manquants.

### Exigence 8 : Construction du graphe DAG à partir des données de workflow

**User Story :** En tant que développeur du plugin, je veux que la construction du graphe DAG soit fiable et correcte, afin que la visualisation reflète fidèlement la topologie du workflow.

#### Critères d'acceptation

1. WHEN un objet Workflow est fourni, THE Package_React SHALL construire un graphe DAG contenant un nœud pour chaque Noeud_Workflow présent dans `status.nodes`.
2. WHEN un Noeud_Workflow déclare des dépendances via le champ `children`, THE Package_React SHALL créer une arête orientée du nœud parent vers chaque nœud enfant.
3. FOR ALL graphes DAG construits, le nombre de nœuds dans le graphe SHALL être égal au nombre de Noeud_Workflow dans `status.nodes` (propriété d'invariant).
4. IF les dépendances d'un workflow contiennent un cycle, THEN THE Package_React SHALL détecter le cycle et retourner une erreur descriptive au lieu de produire un graphe invalide.
5. FOR ALL graphes DAG construits à partir de workflows valides, un tri topologique du graphe SHALL être possible sans erreur (propriété de validité du DAG).
6. WHEN un Noeud_Workflow n'a aucune dépendance, THE Package_React SHALL le positionner comme nœud racine (sans arête entrante) dans le graphe.

### Exigence 9 : Indicateurs de statut visuels

**User Story :** En tant que développeur, je veux des indicateurs visuels clairs pour les statuts de workflows et de nœuds, afin de comprendre rapidement l'état de mes exécutions.

#### Critères d'acceptation

1. THE Package_React SHALL exporter un composant `WorkflowStatusIcon` qui accepte un Statut_Workflow et affiche l'icône et la couleur correspondantes.
2. THE Package_React SHALL exporter un composant `WorkflowStatusBadge` qui affiche le statut sous forme de badge avec icône et libellé textuel.
3. FOR ALL valeurs possibles de Statut_Workflow (`Pending`, `Running`, `Succeeded`, `Failed`, `Error`), THE `WorkflowStatusIcon` SHALL retourner un élément React valide et non nul.
4. THE `WorkflowStatusIcon` SHALL utiliser des attributs `aria-label` descriptifs pour chaque statut afin de garantir l'accessibilité.
5. WHEN le statut est `Running`, THE `WorkflowStatusIcon` SHALL afficher une animation visuelle (spinner ou pulsation) pour indiquer une exécution en cours.

### Exigence 10 : Accessibilité

**User Story :** En tant que développeur utilisant des technologies d'assistance, je veux que le plugin soit accessible, afin de pouvoir consulter les informations de workflows sans barrière.

#### Critères d'acceptation

1. THE Plugin_Frontend SHALL respecter les critères WCAG 2.1 niveau AA pour tous les composants visuels.
2. THE Plugin_Frontend SHALL fournir des alternatives textuelles pour tous les indicateurs de statut visuels dans le tableau et le DAG.
3. WHEN le graphe DAG est affiché, THE Plugin_Frontend SHALL fournir une représentation textuelle alternative accessible décrivant la liste des nœuds et leurs dépendances.
4. THE Plugin_Frontend SHALL garantir un ratio de contraste minimal de 4.5:1 pour tous les textes et de 3:1 pour les éléments graphiques de statut.
