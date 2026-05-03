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

import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Cell,
  CellText,
  Flex,
  SearchField,
  Table,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  useTable,
} from '@backstage/ui';
import type { ColumnConfig } from '@backstage/ui';
import {
  useArgoWorkflows,
  WorkflowStatusIcon,
} from '@backstage-community/plugin-argo-workflows-react';
import type {
  Workflow,
  WorkflowStatus,
} from '@backstage-community/plugin-argo-workflows-common';
import { RiArrowRightSLine } from '@remixicon/react';
import { TaskStatusBar } from './TaskStatusBar';
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
  /** Optional Kubernetes namespace to scope the query */
  namespace?: string;
}

/** Table item type — extends Workflow with a required `id` for BUI Table. */
interface WorkflowItem extends Workflow {
  id: string;
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

/** Base column definitions for the workflow runs table. */
const baseColumns: ColumnConfig<WorkflowItem>[] = [
  {
    id: 'name',
    label: 'Name',
    isRowHeader: true,
    isSortable: true,
    cell: item => <CellText title={item.metadata.name} />,
  },
  {
    id: 'namespace',
    label: 'Namespace',
    isSortable: true,
    cell: item => <CellText title={item.metadata.namespace} />,
  },
  {
    id: 'status',
    label: 'Status',
    cell: item => (
      <Cell>
        <Flex align="center" style={{ gap: 'var(--bui-space-2)' }}>
          <WorkflowStatusIcon status={item.status.phase} size="small" />
          <Text variant="body-small">{item.status.phase}</Text>
        </Flex>
      </Cell>
    ),
  },
  {
    id: 'taskStatus',
    label: 'Task Status',
    cell: item => (
      <Cell>
        <TaskStatusBar nodes={item.status.nodes} />
      </Cell>
    ),
  },
  {
    id: 'duration',
    label: 'Duration',
    cell: item => (
      <CellText
        title={formatDuration(item.status.startedAt, item.status.finishedAt)}
      />
    ),
  },
  {
    id: 'startDate',
    label: 'Start Date',
    isSortable: true,
    cell: item => <CellText title={formatDate(item.status.startedAt)} />,
  },
];

/** All possible workflow status values for the filter toggles. */
const ALL_STATUSES: WorkflowStatus[] = [
  'Succeeded',
  'Failed',
  'Running',
  'Pending',
  'Error',
];

/**
 * Returns a human-readable relative time string (e.g. "Updated just now").
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

/** Builds the full column config including the expand indicator. */
function buildColumns(
  expandedRow: string | null,
): ColumnConfig<WorkflowItem>[] {
  return [
    {
      id: 'expand',
      label: '',
      cell: item => {
        const isExpanded = expandedRow === item.metadata.name;
        return (
          <Cell>
            <RiArrowRightSLine
              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
              className={styles.expandIndicator}
              data-expanded={isExpanded || undefined}
              size={20}
            />
          </Cell>
        );
      },
    },
    ...baseColumns,
  ];
}

/**
 * Displays a table of Argo Workflow runs with expandable DAG views.
 * Clicking a row reveals the DAG visualization inline below the table.
 */
export const WorkflowRunsTable = ({
  labelSelector,
  instanceName,
  namespace,
}: WorkflowRunsTableProps) => {
  const { workflows, loading, error, retry } = useArgoWorkflows({
    labelSelector,
    instanceName,
    namespace,
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated] = useState(() => new Date());
  const columns = useMemo(() => buildColumns(expandedRow), [expandedRow]);

  const handleSelectionChange = useCallback((keys: Set<string | number>) => {
    setStatusFilters(new Set([...keys].map(String)));
  }, []);

  const filteredWorkflows = useMemo(() => {
    let items = workflows ?? [];
    if (statusFilters.size > 0) {
      items = items.filter(wf => statusFilters.has(wf.status.phase));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      items = items.filter(wf =>
        wf.metadata.name.toLowerCase().includes(query),
      );
    }
    return items;
  }, [workflows, statusFilters, searchQuery]);

  const data: WorkflowItem[] = filteredWorkflows.map(wf => ({
    ...wf,
    id: wf.metadata.name,
  }));

  const { tableProps } = useTable({
    mode: 'complete',
    data,
    sortFn: (items, sort) => {
      if (!sort) return items;
      const sorted = [...items].sort((a, b) => {
        if (sort.column === 'name') {
          return a.metadata.name.localeCompare(b.metadata.name);
        }
        if (sort.column === 'namespace') {
          return a.metadata.namespace.localeCompare(b.metadata.namespace);
        }
        if (sort.column === 'startDate') {
          const dateA = a.status.startedAt
            ? new Date(a.status.startedAt).getTime()
            : 0;
          const dateB = b.status.startedAt
            ? new Date(b.status.startedAt).getTime()
            : 0;
          return dateA - dateB;
        }
        return 0;
      });
      return sort.direction === 'descending' ? sorted.reverse() : sorted;
    },
    initialSort: { column: 'startDate', direction: 'descending' },
    paginationOptions: {
      pageSize: 5,
      pageSizeOptions: [5, 10, 25, 50],
    },
  });

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

  const selectedWorkflow = expandedRow
    ? data.find(wf => wf.metadata.name === expandedRow)
    : undefined;

  return (
    <div data-testid="workflow-runs-table" aria-label="Argo Workflow Runs">
      <Flex align="center" justify="between" className={styles.toolbar}>
        <Text variant="title-small">Workflows</Text>
        <Flex align="center" style={{ gap: 'var(--bui-space-3)' }}>
          <ToggleButtonGroup
            selectionMode="multiple"
            selectedKeys={statusFilters}
            onSelectionChange={handleSelectionChange}
            aria-label="Filter by status"
          >
            {ALL_STATUSES.map(status => (
              <ToggleButton key={status} id={status}>
                {status}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <SearchField
            placeholder="Search by name…"
            aria-label="Search workflows by name"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <Flex align="center" style={{ gap: 'var(--bui-space-1)' }}>
            <div className={styles.updatedDot} />
            <Text variant="body-small" className={styles.updatedText}>
              {formatTimeAgo(lastUpdated)}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Table
        columnConfig={columns}
        {...tableProps}
        loading={loading}
        emptyState={
          <Alert
            status="info"
            icon
            title="No workflow runs found"
            description="No Argo Workflow executions were found for this entity."
          />
        }
        rowConfig={{
          onClick: item => {
            setExpandedRow(prev =>
              prev === item.metadata.name ? null : item.metadata.name,
            );
          },
        }}
      />
      {selectedWorkflow && (
        <div className={styles.detailPanel}>
          <Text variant="title-x-small" className={styles.detailTitle}>
            DAG — {selectedWorkflow.metadata.name}
          </Text>
          <WorkflowDAGInline workflow={selectedWorkflow} />
        </div>
      )}
    </div>
  );
};
