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


import classNames from 'classnames';
import type { WorkflowPhase } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import styles from './WorkflowFilters.module.css';

const FILTER_PHASES: WorkflowPhase[] = [
  'Succeeded',
  'Failed',
  'Running',
  'Pending',
  'Error',
];

/**
 * Props for the WorkflowFilters component.
 *
 * @public
 */
export interface WorkflowFiltersProps {
  phases: WorkflowPhase[];
  onPhasesChange: (phases: WorkflowPhase[]) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  lastUpdated: Date | null;
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

/**
 * Filter toolbar with status chips, search input, and poll indicator.
 *
 * @public
 */
export function WorkflowFilters({
  phases,
  onPhasesChange,
  searchText,
  onSearchChange,
  lastUpdated,
}: WorkflowFiltersProps) {
  const isAllActive = phases.length === 0;

  function handleChipClick(phase: WorkflowPhase) {
    if (phases.includes(phase)) {
      onPhasesChange(phases.filter(p => p !== phase));
    } else {
      onPhasesChange([...phases, phase]);
    }
  }

  function handleAllClick() {
    onPhasesChange([]);
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.chips}>
        <button
          type="button"
          className={classNames(styles.chip, {
            [styles.chipActive]: isAllActive,
          })}
          aria-pressed={isAllActive}
          onClick={handleAllClick}
        >
          All
        </button>
        {FILTER_PHASES.map(phase => (
          <button
            key={phase}
            type="button"
            className={classNames(styles.chip, {
              [styles.chipActive]: phases.includes(phase),
            })}
            aria-pressed={phases.includes(phase)}
            onClick={() => handleChipClick(phase)}
          >
            {phase}
          </button>
        ))}
      </div>
      <label className="visually-hidden" htmlFor="workflow-search">
        Search workflows
      </label>
      <input
        id="workflow-search"
        type="text"
        className={styles.searchInput}
        placeholder="Search by name…"
        value={searchText}
        onChange={e => onSearchChange(e.target.value)}
      />
      <span className={styles.pollIndicator}>
        <span className={styles.pollDot} />
        Updated {formatPollTime(lastUpdated)}
      </span>
    </div>
  );
}
