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

import React, { useState, useCallback, useEffect } from 'react';
import type { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';
import { useWorkflowDetail } from '../../hooks';
import { DAGCardFlow } from '../DAGCardFlow';
import { NodeDetailPanel } from '../NodeDetailPanel';
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
  workflowId,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  workflowId: string;
}) {
  return (
    <button
      type="button"
      className={`${styles.expandButton}${isExpanded ? ` ${styles.expandButtonExpanded}` : ''}`}
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`expanded-content-${workflowId}`}
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const workflowId = `${workflow.namespace}/${workflow.name}`;

  const {
    workflow: detail,
    loading,
    error,
  } = useWorkflowDetail(workflow.namespace, workflow.name);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
    },
    [],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Escape key closes the panel
  useEffect(() => {
    if (!selectedNodeId) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNodeId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedNodeId]);

  if (loading) {
    return (
      <div
        className={styles.expandedContent}
        id={`expanded-content-${workflowId}`}
        role="region"
        aria-label={`Workflow DAG for ${workflow.name}`}
      >
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={styles.expandedContent}
        id={`expanded-content-${workflowId}`}
        role="region"
        aria-label={`Workflow DAG for ${workflow.name}`}
      >
        Unable to load workflow detail: {error.message}
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const selectedNode = selectedNodeId
    ? detail.nodes.find(n => n.id === selectedNodeId) ?? null
    : null;

  return (
    <div
      className={styles.expandedContent}
      id={`expanded-content-${workflowId}`}
      role="region"
      aria-label={`Workflow DAG for ${workflow.name}`}
    >
      <div className={styles.dagWithPanel}>
        <div className={styles.dagArea}>
          <DAGCardFlow
            nodes={detail.nodes}
            selectedNodeId={selectedNodeId ?? undefined}
            onNodeClick={handleNodeClick}
          />
        </div>
        {selectedNode && (
          <NodeDetailPanel node={selectedNode} onClose={handleClosePanel} />
        )}
      </div>
    </div>
  );
}
