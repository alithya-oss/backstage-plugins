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

import { useState } from 'react';
import { Alert, Button, ButtonIcon, Flex, Skeleton, Text } from '@backstage/ui';
import {
  useArgoWorkflows,
  WorkflowStatusIcon,
} from '@backstage-community/plugin-argo-workflows-react';
import type { Workflow } from '@backstage-community/plugin-argo-workflows-common';
import { RiArrowDownSLine, RiArrowUpSLine } from '@remixicon/react';
import { WorkflowDAGInline } from './WorkflowDAGInline';
import styles from './WorkflowRunsTable.module.css';

/**
 * Props for the WorkflowRunsTable component.
 */
export interface WorkflowRunsTableProps {
  /** Kubernetes label selector to filter workflows */
  labelSelector: string;
  /** Optional Argo Workflows instance name */
  instanceName?: string;
}

/**
 * Formats a duration between two ISO date strings into a human-readable string.
 */
function formatDuration(startedAt?: string, finishedAt?: string): string {
  if (!startedAt || !finishedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0 || Number.isNaN(diffMs)) return '—';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Formats an ISO date string into a localized date/time string.
 */
function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString();
}

/**
 * Displays a table of Argo Workflow runs with expandable rows.
 * Clicking the expand button on a row reveals the DAG visualization inline.
 */
export const WorkflowRunsTable = ({
  labelSelector,
  instanceName,
}: WorkflowRunsTableProps) => {
  const { workflows, loading, error, retry } = useArgoWorkflows({
    labelSelector,
    instanceName,
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        data-testid="workflow-runs-table-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Flex direction="column" style={{ gap: 'var(--bui-space-4)' }}>
          <Skeleton style={{ height: 40, width: '100%' }} />
          <Skeleton style={{ height: 40, width: '100%' }} />
          <Skeleton style={{ height: 40, width: '100%' }} />
        </Flex>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="workflow-runs-table-error">
        <Alert
          status="danger"
          icon
          title="Failed to load workflows"
          description={error.message}
          customActions={
            <Button variant="secondary" onPress={retry}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // Sort workflows by startedAt descending
  const sortedWorkflows = [...workflows].sort((a, b) => {
    const dateA = a.status.startedAt
      ? new Date(a.status.startedAt).getTime()
      : 0;
    const dateB = b.status.startedAt
      ? new Date(b.status.startedAt).getTime()
      : 0;
    return dateB - dateA;
  });

  if (sortedWorkflows.length === 0) {
    return (
      <div data-testid="workflow-runs-table-empty" role="status">
        <Alert
          status="info"
          icon
          title="No workflow runs found"
          description="No Argo Workflow executions were found for this entity."
        />
      </div>
    );
  }

  const toggleRow = (name: string) => {
    setExpandedRow(prev => (prev === name ? null : name));
  };

  return (
    <div
      data-testid="workflow-runs-table"
      role="region"
      aria-label="Argo Workflow Runs"
    >
      <Text variant="title-small" className={styles.title}>
        Argo Workflow Runs
      </Text>
      <table className={styles.table} role="table">
        <thead>
          <tr className={styles.headerRow}>
            <th className={styles.headerCell} scope="col" aria-label="Expand" />
            <th className={styles.headerCell} scope="col">
              Name
            </th>
            <th className={styles.headerCell} scope="col">
              Status
            </th>
            <th className={styles.headerCell} scope="col">
              Duration
            </th>
            <th className={styles.headerCell} scope="col">
              Start Date
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedWorkflows.map((wf: Workflow) => {
            const isExpanded = expandedRow === wf.metadata.name;
            return (
              <WorkflowRow
                key={wf.metadata.name}
                workflow={wf}
                isExpanded={isExpanded}
                onToggle={() => toggleRow(wf.metadata.name)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface WorkflowRowProps {
  workflow: Workflow;
  isExpanded: boolean;
  onToggle: () => void;
}

function WorkflowRow({ workflow, isExpanded, onToggle }: WorkflowRowProps) {
  return (
    <>
      <tr className={styles.row}>
        <td className={styles.cell}>
          <ButtonIcon
            variant="tertiary"
            icon={
              isExpanded ? (
                <RiArrowUpSLine size={18} />
              ) : (
                <RiArrowDownSLine size={18} />
              )
            }
            onPress={onToggle}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${
              workflow.metadata.name
            }`}
          />
        </td>
        <td className={styles.cell}>
          <Text variant="body-small">{workflow.metadata.name}</Text>
        </td>
        <td className={styles.cell}>
          <Flex align="center" style={{ gap: 'var(--bui-space-2)' }}>
            <WorkflowStatusIcon status={workflow.status.phase} size="small" />
            <Text variant="body-small">{workflow.status.phase}</Text>
          </Flex>
        </td>
        <td className={styles.cell}>
          <Text variant="body-small">
            {formatDuration(
              workflow.status.startedAt,
              workflow.status.finishedAt,
            )}
          </Text>
        </td>
        <td className={styles.cell}>
          <Text variant="body-small">
            {formatDate(workflow.status.startedAt)}
          </Text>
        </td>
      </tr>
      {isExpanded && (
        <tr className={styles.detailRow}>
          <td colSpan={5} className={styles.detailCell}>
            <WorkflowDAGInline workflow={workflow} />
          </td>
        </tr>
      )}
    </>
  );
}
