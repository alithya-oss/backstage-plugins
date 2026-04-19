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

import React, { useState, useMemo, useCallback } from 'react';
import { Table, TableColumn } from '@backstage/core-components';
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiTimeLine,
} from '@remixicon/react';
import classNames from 'classnames';
import type {
  WorkflowSummary,
  WorkflowPhase,
} from '@backstage-community/plugin-argo-workflows-common';
import { formatDuration } from '@backstage-community/plugin-argo-workflows-common';
import styles from './WorkflowStatusIndicator.module.css';
import filterStyles from './WorkflowFilters.module.css';
import { WorkflowFilters } from './WorkflowFilters';

/**
 * Props for the WorkflowTable component.
 *
 * @public
 */
export interface WorkflowTableProps {
  workflows: WorkflowSummary[];
  loading: boolean;
  lastUpdated?: Date | null;
}

function WorkflowStatusIndicator({ phase }: { phase: WorkflowPhase }) {
  switch (phase) {
    case 'Succeeded':
      return (
        <span className={styles.status}>
          <RiCheckboxCircleLine
            className={classNames(styles.statusIcon, styles.ok)}
          />
          Succeeded
        </span>
      );
    case 'Failed':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine
            className={classNames(styles.statusIcon, styles.error)}
          />
          Failed
        </span>
      );
    case 'Error':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine
            className={classNames(styles.statusIcon, styles.error)}
          />
          Error
        </span>
      );
    case 'Running':
      return (
        <span className={styles.status}>
          <RiRefreshLine
            className={classNames(styles.statusIcon, styles.running)}
          />
          Running
        </span>
      );
    case 'Pending':
      return (
        <span className={styles.status}>
          <RiTimeLine
            className={classNames(styles.statusIcon, styles.pending)}
          />
          Pending
        </span>
      );
    default:
      return <span>{phase}</span>;
  }
}

/**
 * Formats an ISO 8601 date string into a human-readable relative time.
 */
function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();

  if (Number.isNaN(then)) return '—';

  const diffMs = now - then;
  if (diffMs < 0) return 'just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
}

const columns: TableColumn<WorkflowSummary>[] = [
  {
    title: 'Name',
    field: 'name',
  },
  {
    title: 'Status',
    field: 'phase',
    render: (row: WorkflowSummary) => (
      <WorkflowStatusIndicator phase={row.phase} />
    ),
  },
  {
    title: 'Started',
    field: 'startedAt',
    render: (row: WorkflowSummary) => formatRelativeTime(row.startedAt),
    customSort: (a: WorkflowSummary, b: WorkflowSummary) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    defaultSort: 'desc',
  },
  {
    title: 'Duration',
    field: 'duration',
    render: (row: WorkflowSummary) => (
      <span style={{ fontFamily: 'monospace' }}>
        {formatDuration(row.duration)}
      </span>
    ),
    customSort: (a: WorkflowSummary, b: WorkflowSummary) =>
      (a.duration ?? 0) - (b.duration ?? 0),
  },
  {
    title: 'Namespace',
    field: 'namespace',
  },
];

/**
 * Table component displaying Argo Workflow executions with status badges.
 *
 * @public
 */
export function WorkflowTable({
  workflows,
  loading,
  lastUpdated,
}: WorkflowTableProps) {
  const [activePhases, setActivePhases] = useState<WorkflowPhase[]>([]);
  const [searchText, setSearchText] = useState('');

  const filteredWorkflows = useMemo(() => {
    let result = workflows;

    if (activePhases.length > 0) {
      result = result.filter(w => activePhases.includes(w.phase));
    }

    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      result = result.filter(w => w.name.toLowerCase().includes(lower));
    }

    return result;
  }, [workflows, activePhases, searchText]);

  const handleClearFilters = useCallback(() => {
    setActivePhases([]);
    setSearchText('');
  }, []);

  const hasActiveFilters = activePhases.length > 0 || searchText.trim() !== '';
  const showEmptyFilterState =
    hasActiveFilters && filteredWorkflows.length === 0 && workflows.length > 0;

  return (
    <>
      <WorkflowFilters
        phases={activePhases}
        onPhasesChange={setActivePhases}
        searchText={searchText}
        onSearchChange={setSearchText}
        lastUpdated={lastUpdated ?? null}
      />
      {showEmptyFilterState ? (
        <div className={filterStyles.emptyFilters}>
          No workflows match the current filters.{' '}
          <button
            type="button"
            className={filterStyles.clearLink}
            onClick={handleClearFilters}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <Table<WorkflowSummary>
          title="Argo Workflows"
          columns={columns}
          data={filteredWorkflows}
          isLoading={loading}
          options={{
            pageSize: 20,
            pageSizeOptions: [10, 20, 50],
            sorting: true,
            paging: true,
          }}
        />
      )}
    </>
  );
}
