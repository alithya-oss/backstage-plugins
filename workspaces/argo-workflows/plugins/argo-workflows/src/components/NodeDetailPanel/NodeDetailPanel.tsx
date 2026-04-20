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
import type { NodeStatus } from '@backstage-community/plugin-argo-workflows-common';
import {
  PHASE_ICON_MAP,
  formatDuration,
} from '@backstage-community/plugin-argo-workflows-common';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { argoWorkflowsTranslationRef } from '../../translation';
import styles from './NodeDetailPanel.module.css';

/**
 * Props for the NodeDetailPanel component.
 * @public
 */
export interface NodeDetailPanelProps {
  node: NodeStatus;
  onClose: () => void;
}

const BORDER_CLASS: Record<string, string> = {
  Succeeded: styles.borderSuccess,
  Failed: styles.borderDanger,
  Error: styles.borderDanger,
  Running: styles.borderInfo,
  Pending: styles.borderWarning,
  Skipped: styles.borderNeutral,
  Omitted: styles.borderNeutral,
};

const ERROR_PHASES = new Set(['Failed', 'Error']);

/**
 * Side panel showing detailed metadata for a selected DAG node.
 *
 * @public
 */
export function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  const { t } = useTranslationRef(argoWorkflowsTranslationRef);
  const borderClass = BORDER_CLASS[node.phase] ?? '';
  const icon = PHASE_ICON_MAP[node.phase] ?? '—';
  const showError = ERROR_PHASES.has(node.phase) && !!node.message;

  return (
    <div
      className={`${styles.panel} ${borderClass}`}
      data-testid="node-detail-panel"
      role="complementary"
      aria-label={`Node detail for ${node.displayName}`}
      aria-live="polite"
    >
      <div className={styles.header}>
        <span className={styles.headerIcon}>{icon}</span>
        <span className={styles.headerName} title={node.displayName}>
          {node.displayName}
        </span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('nodePanel.closeLabel')}
          data-testid="panel-close"
        >
          ×
        </button>
      </div>

      <div className={styles.grid}>
        <span className={styles.label}>{t('nodePanel.phase')}</span>
        <span className={styles.value}>{node.phase}</span>

        <span className={styles.label}>{t('nodePanel.type')}</span>
        <span className={styles.value}>{node.type}</span>

        <span className={styles.label}>{t('nodePanel.template')}</span>
        <span className={styles.value}>{node.templateName ?? '—'}</span>

        <span className={styles.label}>{t('nodePanel.started')}</span>
        <span className={`${styles.value} ${styles.mono}`}>
          {node.startedAt ?? '—'}
        </span>

        <span className={styles.label}>{t('nodePanel.finished')}</span>
        <span className={`${styles.value} ${styles.mono}`}>
          {node.finishedAt ?? '—'}
        </span>

        <span className={styles.label}>{t('nodePanel.duration')}</span>
        <span className={`${styles.value} ${styles.mono}`}>
          {formatDuration(node.duration)}
        </span>
      </div>

      {showError && (
        <div className={styles.errorBox} data-testid="panel-error-message">
          {node.message}
        </div>
      )}
    </div>
  );
}
