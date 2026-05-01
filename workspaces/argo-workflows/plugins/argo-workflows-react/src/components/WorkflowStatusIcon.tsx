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

import type { ComponentType, FC } from 'react';
import type { WorkflowStatus } from '@backstage-community/plugin-argo-workflows-common';
import { Box } from '@backstage/ui';
import {
  RiTimeLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiErrorWarningLine,
} from '@remixicon/react';
import styles from './WorkflowStatusIcon.module.css';

/** Props for the WorkflowStatusIcon component */
export interface WorkflowStatusIconProps {
  /** The workflow execution status to display */
  status: WorkflowStatus;
  /** Icon size variant */
  size?: 'small' | 'medium' | 'large';
}

const sizeMap: Record<string, number> = {
  small: 16,
  medium: 24,
  large: 32,
};

const statusAriaLabelMap: Record<WorkflowStatus, string> = {
  Pending: 'Status: Pending – workflow is waiting to start',
  Running: 'Status: Running – workflow is currently executing',
  Succeeded: 'Status: Succeeded – workflow completed successfully',
  Failed: 'Status: Failed – workflow execution failed',
  Error: 'Status: Error – workflow encountered an error',
};

const statusClassMap: Record<WorkflowStatus, string> = {
  Pending: styles.pending,
  Running: styles.running,
  Succeeded: styles.succeeded,
  Failed: styles.failed,
  Error: styles.error,
};

const statusIconMap: Record<WorkflowStatus, ComponentType<{ size: number }>> = {
  Pending: RiTimeLine,
  Running: RiLoader4Line,
  Succeeded: RiCheckboxCircleLine,
  Failed: RiCloseCircleLine,
  Error: RiErrorWarningLine,
};

/**
 * Displays a colored icon representing a workflow execution status.
 *
 * Uses Remix Icons with BUI CSS custom-property tokens for colors.
 */
export const WorkflowStatusIcon: FC<WorkflowStatusIconProps> = ({
  status,
  size = 'medium',
}) => {
  const px = sizeMap[size] ?? sizeMap.medium;
  const ariaLabel = statusAriaLabelMap[status] ?? `Status: ${status}`;
  const colorClass = statusClassMap[status] ?? styles.pending;
  const IconComponent = statusIconMap[status] ?? RiTimeLine;
  const isRunning = status === 'Running';

  return (
    <Box
      role="img"
      aria-label={ariaLabel}
      className={`${styles.wrapper} ${colorClass} ${
        isRunning ? styles.spin : ''
      }`}
      data-testid={`workflow-status-icon-${status.toLowerCase()}`}
    >
      <IconComponent size={px} />
    </Box>
  );
};
