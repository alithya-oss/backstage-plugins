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

import React from 'react';
import classNames from 'classnames';
import { ArgoWorkflowsError } from '../../api';
import styles from './WorkflowEmptyState.module.css';

/**
 * Props for the WorkflowEmptyState component.
 *
 * @public
 */
export interface WorkflowEmptyStateProps {
  error?: Error | null;
  namespace?: string;
  labelSelector?: string;
  workflowCount?: number;
}

type AlertSeverity = 'info' | 'warning' | 'danger';

interface ClassifiedAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
}

function classifyError(error: Error): ClassifiedAlert {
  const message = error.message || '';
  if (message.includes('backstage.io/kubernetes-namespace')) {
    return {
      severity: 'warning',
      title: 'Missing Configuration',
      message:
        'No Argo Workflows annotations found on this entity. Add backstage.io/kubernetes-namespace to your catalog-info.yaml.',
    };
  }

  if (error instanceof ArgoWorkflowsError) {
    if (error.statusCode === 403) {
      return {
        severity: 'danger',
        title: 'Access Denied',
        message:
          error.message.includes('permission')
            ? 'You don\'t have permission to view Argo Workflows for this entity. Contact your Backstage administrator.'
            : 'The Backstage service account needs get and list permissions on workflows.argoproj.io.',
      };
    }
    if (error.statusCode === 502 || error.statusCode === 504) {
      return {
        severity: 'danger',
        title: 'Cluster Unreachable',
        message:
          'Unable to connect to the Kubernetes cluster. Check your Backstage Kubernetes plugin configuration.',
      };
    }
  }

  return {
    severity: 'danger',
    title: 'Error',
    message: message || 'An unknown error occurred.',
  };
}

function buildEmptyMessage(
  namespace?: string,
  labelSelector?: string,
): string {
  const ns = namespace?.trim();
  const selector = labelSelector?.trim();

  if (!ns) {
    return 'No Argo Workflows found for this entity.';
  }
  if (selector) {
    return `No Argo Workflows found in namespace ${ns} matching label selector ${selector}.`;
  }
  return `No Argo Workflows found in namespace ${ns}.`;
}

const severityStyleMap: Record<AlertSeverity, string> = {
  info: styles.alertInfo,
  warning: styles.alertWarning,
  danger: styles.alertDanger,
};

/**
 * Displays actionable empty and error states for the Argo Workflows plugin.
 *
 * @public
 */
export function WorkflowEmptyState({
  error,
  namespace,
  labelSelector,
  workflowCount,
}: WorkflowEmptyStateProps) {
  if (error) {
    const classified = classifyError(error);
    const role = classified.severity === 'info' ? 'status' : 'alert';

    return (
      <div
        className={classNames(
          styles.alert,
          severityStyleMap[classified.severity],
        )}
        role={role}
      >
        <div className={styles.alertTitle}>{classified.title}</div>
        <div className={styles.alertMessage}>{classified.message}</div>
      </div>
    );
  }

  if (workflowCount === 0) {
    return (
      <div
        className={classNames(styles.alert, styles.alertInfo)}
        role="status"
      >
        <div className={styles.alertTitle}>No Workflows</div>
        <div className={styles.alertMessage}>
          {buildEmptyMessage(namespace, labelSelector)}
        </div>
      </div>
    );
  }

  return null;
}
