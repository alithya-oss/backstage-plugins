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

import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  useTable,
  Cell,
  CellText,
  type ColumnConfig,
  type TableItem,
  SearchField,
  TagGroup,
  Tag,
  Flex,
  Text,
} from '@backstage/ui';
import {
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiTimeLine,
} from '@remixicon/react';
import type {
  WorkflowSummary,
  WorkflowPhase,
} from '@backstage-community/plugin-argo-workflows-common';
import { formatDuration } from '@backstage-community/plugin-argo-workflows-common';
import {
  ExpandButton,
  WorkflowExpandedContent,
} from './WorkflowExpandableRow';
import { NodeStatusDots } from './NodeStatusDots';
import styles from './WorkflowStatusIndicator.module.css';
import filterStyles from './WorkflowFilters.module.css';

/**
 * WorkflowSummary extended with an `id` field for BUI Table compatibility.
 */
type WorkflowTableItem = WorkflowSummary & TableItem;

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

const PHASE_KEYS: { id: WorkflowPhase }[] = [
  { id: 'Succeeded' },
  { id: 'Failed' },
  { id: 'Running' },
  { id: 'Pending' },
  { id: 'Error' },
];

function WorkflowStatusIndicator({ phase }: { phase: WorkflowPhase }) {
  switch (phase) {
    case 'Succeeded':
      return (
        <span className={styles.status}>
          <RiCheckboxCircleLine
            className={`${styles.statusIcon} ${styles.ok}`}
          />
          Succeeded
        </span>
      );
    case 'Failed':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine
            className={`${styles.statusIcon} ${styles.error}`}
          />
          Failed
        </span>
      );
    case 'Error':
      return (
        <span className={styles.status}>
          <RiErrorWarningLine
            className={`${styles.statusIcon} ${styles.error}`}
          />
          Error
        </span>
      );
    case 'Running':
      return (
        <span className={styles.status}>
          <RiRefreshLine
            className={`${styles.statusIcon} ${styles.running}`}
          />
          Running
        </span>
      );
    case 'Pending':
      return (
        <span className={styles.status}>
          <RiTimeLine className={`${styles.statusIcon} ${styles.pending}`} />
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

/**
 * Formats a Date into a short poll indicator string.
 */
function formatPollTime(lastUpdated: Date | null): string {
  if (!lastUpdated) return '—';
  const time = lastUpdated.getTime();
  if (Number.isNaN(time)) return '—';
  const diffSec = Math.floor((Date.now() - time) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  return `${diffMin}m ago`;
}

const columns: ColumnConfig<WorkflowTableItem>[] = [
  {
    id: 'name',
    label: 'Name',
    isRowHeader: true,
    cell: item => <CellText title={item.name} />,
  },
  {
    id: 'phase',
    label: 'Status',
    cell: item => (
      <Cell>
        <WorkflowStatusIndicator phase={item.phase} />
      </Cell>
    ),
  },
  {
    id: 'nodeStatus',
    label: 'Node Status',
    cell: item => (
      <Cell>
        <NodeStatusDots nodes={item.nodes} />
      </Cell>
    ),
  },
  {
    id: 'startedAt',
    label: 'Started',
    isSortable: true,
    cell: item => <CellText title={formatRelativeTime(item.startedAt)} />,
  },
  {
    id: 'duration',
    label: 'Duration',
    isSortable: true,
    cell: item => <CellText title={formatDuration(item.duration)} />,
  },
  {
    id: 'namespace',
    label: 'Namespace',
    cell: item => <CellText title={item.namespace} />,
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
  const [activePhases, setActivePhases] = useState<Set<WorkflowPhase>>(
    new Set(),
  );
  const [searchText, setSearchText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggleExpand = useCallback(
    (workflowId: string) => {
      setExpandedId(prev => (prev === workflowId ? null : workflowId));
    },
    [],
  );

  const expandableColumns = useMemo<ColumnConfig<WorkflowTableItem>[]>(
    () => [
      {
        id: 'expand',
        label: '',
        cell: item => (
          <Cell>
            <ExpandButton
              isExpanded={expandedId === item.id}
              onToggle={() => handleToggleExpand(item.id)}
            />
          </Cell>
        ),
      },
      ...columns,
    ],
    [expandedId, handleToggleExpand],
  );

  const tableData = useMemo<WorkflowTableItem[]>(() => {
    let result: WorkflowTableItem[] = workflows.map(w => ({
      ...w,
      id: `${w.namespace}/${w.name}`,
    }));

    if (activePhases.size > 0) {
      result = result.filter(w => activePhases.has(w.phase));
    }

    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      result = result.filter(w => w.name.toLowerCase().includes(lower));
    }

    return result;
  }, [workflows, activePhases, searchText]);

  const handleClearFilters = useCallback(() => {
    setActivePhases(new Set());
    setSearchText('');
  }, []);

  const { tableProps } = useTable<WorkflowTableItem>({
    mode: 'complete',
    data: loading ? undefined : tableData,
    sortFn: (data, sort) => {
      const { column, direction } = sort;
      return [...data].sort((a, b) => {
        let cmp = 0;
        if (column === 'startedAt') {
          cmp =
            new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        } else if (column === 'duration') {
          cmp = (a.duration ?? 0) - (b.duration ?? 0);
        }
        return direction === 'descending' ? -cmp : cmp;
      });
    },
    initialSort: { column: 'startedAt', direction: 'descending' },
    paginationOptions: {
      pageSize: 20,
      pageSizeOptions: [10, 20, 50],
    },
  });

  const hasActiveFilters = activePhases.size > 0 || searchText.trim() !== '';
  const showEmptyFilterState =
    hasActiveFilters && tableData.length === 0 && workflows.length > 0;

  const selectedKeys = useMemo(
    () => (activePhases.size === 0 ? 'all' as const : activePhases),
    [activePhases],
  );

  return (
    <>
      <Flex gap="3" mb="4" align="center">
        <TagGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={selection => {
            if (selection === 'all') {
              setActivePhases(new Set());
            } else {
              setActivePhases(selection as Set<WorkflowPhase>);
            }
          }}
        >
          {PHASE_KEYS.map(({ id }) => (
            <Tag key={id} id={id}>
              {id}
            </Tag>
          ))}
        </TagGroup>
        <SearchField
          value={searchText}
          onChange={setSearchText}
          placeholder="Search by name…"
        />
        <Flex gap="1" align="center" style={{ marginLeft: 'auto' }}>
          <span className={filterStyles.pollDot} />
          <Text variant="body-x-small" color="secondary">
            Updated {formatPollTime(lastUpdated ?? null)}
          </Text>
        </Flex>
      </Flex>

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
        <>
          <Table<WorkflowTableItem>
            columnConfig={expandableColumns}
            {...tableProps}
          />
          {expandedId && (
            <div data-testid="expanded-row-content">
              {(() => {
                const wf = workflows.find(
                  w => `${w.namespace}/${w.name}` === expandedId,
                );
                return wf ? <WorkflowExpandedContent workflow={wf} /> : null;
              })()}
            </div>
          )}
        </>
      )}
    </>
  );
}
