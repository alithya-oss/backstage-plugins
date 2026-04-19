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
import type { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';
import { useWorkflowDetail } from '../../hooks';
import { DAGCardFlow } from '../DAGCardFlow';
import styles from './WorkflowExpandableRow.module.css';

/**
 * Props for the WorkflowExpandableRow component.
 * @public
 */
export interface WorkflowExpandableRowProps {
  workflow: WorkflowSummary;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Expand button for a workflow table row.
 * @public
 */
export function ExpandButton({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.expandButton}${isExpanded ? ` ${styles.expandButtonExpanded}` : ''}`}
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      ▶
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonCard} />
      <span className={styles.skeletonArrow}>→</span>
      <div className={styles.skeletonCard} />
      <span className={styles.skeletonArrow}>→</span>
      <div className={styles.skeletonCard} />
      <span className={styles.skeletonArrow}>→</span>
      <div className={styles.skeletonCard} />
    </div>
  );
}

/**
 * Expanded content area for a workflow row showing the DAG card flow.
 * @public
 */
export function WorkflowExpandedContent({
  workflow,
}: {
  workflow: WorkflowSummary;
}) {
  const {
    workflow: detail,
    loading,
    error,
  } = useWorkflowDetail(workflow.namespace, workflow.name);

  if (loading) {
    return (
      <div className={styles.expandedContent}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.expandedContent}>
        Unable to load workflow detail: {error.message}
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div className={styles.expandedContent}>
      <DAGCardFlow nodes={detail.nodes} />
    </div>
  );
}
