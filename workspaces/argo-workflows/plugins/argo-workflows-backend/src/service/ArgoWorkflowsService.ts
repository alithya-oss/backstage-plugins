/*
 * Copyright 2026 The Alithya Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import {
  InputError,
  NotFoundError,
  ServiceUnavailableError,
  ForwardedError,
} from '@backstage/errors';
import {
  parseWorkflow,
  type Workflow,
} from '@backstage-community/plugin-argo-workflows-common';
import fetch from 'node-fetch';

/** Internal representation of a configured Argo Workflows instance. */
interface ArgoInstance {
  name: string;
  baseUrl: string;
  token: string;
}

/**
 * Regex pattern for a single Kubernetes label selector expression.
 *
 * Supports:
 *   - key=value / key==value / key!=value (equality-based)
 *   - key in (v1,v2) / key notin (v1,v2) (set-based)
 *   - key / !key (existence-based)
 *
 * Label keys may include an optional DNS prefix (e.g. `app.kubernetes.io/name`).
 * Label values follow Kubernetes conventions: up to 63 chars, alphanumeric with
 * internal dashes, underscores, and dots.
 */
const LABEL_KEY_PATTERN =
  '([a-zA-Z]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\\.[a-zA-Z]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\\/)?[a-zA-Z_]([a-zA-Z0-9._-]*[a-zA-Z0-9_])?';
const LABEL_VALUE_PATTERN = '[a-zA-Z0-9]([a-zA-Z0-9._-]{0,61}[a-zA-Z0-9])?';

const EQUALITY_EXPR = new RegExp(
  `^${LABEL_KEY_PATTERN}\\s*(==?|!=)\\s*${LABEL_VALUE_PATTERN}$`,
);
const SET_EXPR = new RegExp(
  `^${LABEL_KEY_PATTERN}\\s+(in|notin)\\s+\\(\\s*${LABEL_VALUE_PATTERN}(\\s*,\\s*${LABEL_VALUE_PATTERN})*\\s*\\)$`,
);
const EXISTS_EXPR = new RegExp(`^!?${LABEL_KEY_PATTERN}$`);

/**
 * Validates a single label selector expression.
 */
function isValidSelectorExpression(expr: string): boolean {
  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    return false;
  }
  return (
    EQUALITY_EXPR.test(trimmed) ||
    SET_EXPR.test(trimmed) ||
    EXISTS_EXPR.test(trimmed)
  );
}

/**
 * Splits a label selector string on commas that are outside parentheses.
 * This ensures set-based expressions like `key in (v1,v2)` are not split.
 */
function splitSelectorExpressions(selector: string): string[] {
  const expressions: string[] = [];
  let current = '';
  let depth = 0;

  for (const ch of selector) {
    if (ch === '(') {
      depth++;
      current += ch;
    } else if (ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === ',' && depth === 0) {
      expressions.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.length > 0) {
    expressions.push(current);
  }

  return expressions;
}

/**
 * Validates a full Kubernetes label selector string (comma-separated expressions).
 * Returns an error message if invalid, or undefined if valid.
 */
export function validateLabelSelector(selector: string): string | undefined {
  if (selector.trim().length === 0) {
    return 'le sélecteur ne peut pas être vide';
  }

  const expressions = splitSelectorExpressions(selector);
  const invalidExpressions: string[] = [];

  for (const expr of expressions) {
    if (!isValidSelectorExpression(expr)) {
      invalidExpressions.push(expr.trim());
    }
  }

  if (invalidExpressions.length > 0) {
    return `expressions invalides : ${invalidExpressions
      .map(e => `"${e}"`)
      .join(', ')}`;
  }

  return undefined;
}

/**
 * Service that communicates with Argo Workflows server instances.
 *
 * Reads configuration from `argoWorkflows.instances` in `app-config.yaml`,
 * resolves instances by name, validates label selectors, and proxies
 * requests to the Argo Workflows API.
 */
export class ArgoWorkflowsService {
  private readonly instances: ArgoInstance[];
  private readonly defaultInstance: string | undefined;
  private readonly logger: LoggerService;

  constructor(config: RootConfigService, logger: LoggerService) {
    this.logger = logger;
    this.instances = [];

    const argoConfig = config.getOptionalConfig('argoWorkflows');
    if (!argoConfig) {
      this.defaultInstance = undefined;
      this.logger.warn(
        'Aucune configuration argoWorkflows trouvée dans app-config.yaml',
      );
      return;
    }

    this.defaultInstance = argoConfig.getOptionalString('defaultInstance');

    const instanceConfigs = argoConfig.getOptionalConfigArray('instances');
    if (!instanceConfigs || instanceConfigs.length === 0) {
      this.logger.warn(
        'Aucune instance Argo Workflows configurée dans argoWorkflows.instances',
      );
      return;
    }

    for (const instanceConfig of instanceConfigs) {
      this.instances.push({
        name: instanceConfig.getString('name'),
        baseUrl: instanceConfig.getString('baseUrl'),
        token: instanceConfig.getString('token'),
      });
    }
  }

  /**
   * Lists workflows from the Argo Workflows API filtered by a label selector.
   *
   * @param instanceName - The name of the Argo instance to query (empty string to use default)
   * @param labelSelector - A Kubernetes label selector string
   * @returns A list of parsed Workflow objects
   */
  async listWorkflows(
    instanceName: string,
    labelSelector: string,
  ): Promise<Workflow[]> {
    const instance = this.resolveInstance(instanceName);

    const validationError = validateLabelSelector(labelSelector);
    if (validationError) {
      throw new InputError(`Sélecteur de labels invalide : ${validationError}`);
    }

    const url = `${
      instance.baseUrl
    }/api/v1/workflows?listOptions.labelSelector=${encodeURIComponent(
      labelSelector,
    )}`;

    const response = await this.fetchFromArgo(instance, url);
    const body = (await response.json()) as Record<string, unknown>;

    const rawItems =
      (body.items as Record<string, unknown>[] | undefined) ?? [];

    return rawItems.map(raw => {
      try {
        return parseWorkflow(raw);
      } catch (error) {
        throw new ForwardedError(
          'Réponse invalide du serveur Argo : champs manquants',
          error,
        );
      }
    });
  }

  /**
   * Gets a single workflow by namespace and name from the Argo Workflows API.
   *
   * @param instanceName - The name of the Argo instance to query (empty string to use default)
   * @param namespace - The Kubernetes namespace of the workflow
   * @param name - The name of the workflow
   * @returns A parsed Workflow object
   */
  async getWorkflow(
    instanceName: string,
    namespace: string,
    name: string,
  ): Promise<Workflow> {
    const instance = this.resolveInstance(instanceName);

    const url = `${instance.baseUrl}/api/v1/workflows/${encodeURIComponent(
      namespace,
    )}/${encodeURIComponent(name)}`;

    const response = await this.fetchFromArgo(instance, url);
    const body = (await response.json()) as Record<string, unknown>;

    try {
      return parseWorkflow(body);
    } catch (error) {
      throw new ForwardedError(
        'Réponse invalide du serveur Argo : champs manquants',
        error,
      );
    }
  }

  /**
   * Resolves an Argo Workflows instance by name.
   * Falls back to the default instance if no name is provided.
   */
  private resolveInstance(instanceName: string): ArgoInstance {
    if (this.instances.length === 0) {
      throw new ServiceUnavailableError(
        'Aucune instance Argo Workflows configurée',
      );
    }

    const targetName = instanceName || this.defaultInstance;

    if (!targetName) {
      throw new InputError(
        "Aucun nom d'instance fourni et aucune instance par défaut configurée",
      );
    }

    const instance = this.instances.find(i => i.name === targetName);
    if (!instance) {
      throw new NotFoundError(
        `Instance Argo Workflows '${targetName}' non trouvée`,
      );
    }

    return instance;
  }

  /**
   * Performs an authenticated HTTP GET request to the Argo Workflows server.
   * Handles network errors (502) and HTTP error responses.
   */
  private async fetchFromArgo(
    instance: ArgoInstance,
    url: string,
  ): Promise<{ json(): Promise<unknown> }> {
    let response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${instance.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      this.logger.error(
        `Erreur de connexion au serveur Argo Workflows (${instance.name}): ${error}`,
      );
      throw new ForwardedError(
        'Le serveur Argo Workflows est indisponible',
        error,
      );
    }

    if (!response.ok) {
      const statusCode = response.status;
      this.logger.error(
        `Erreur HTTP ${statusCode} du serveur Argo Workflows (${instance.name}): ${url}`,
      );

      // Propagate the HTTP status code but use a generic message
      // to avoid exposing internal details
      const err = new Error(
        `Erreur du serveur Argo Workflows (HTTP ${statusCode})`,
      );
      (err as any).statusCode = statusCode;
      throw err;
    }

    return response;
  }
}
