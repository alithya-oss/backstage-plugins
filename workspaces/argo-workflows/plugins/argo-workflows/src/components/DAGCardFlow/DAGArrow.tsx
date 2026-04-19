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
import styles from './DAGArrow.module.css';

/**
 * Arrow status type for DAG column connections.
 * @public
 */
export type ArrowStatus = 'success' | 'danger' | 'inactive';

/**
 * Props for the DAGArrow component.
 * @public
 */
export interface DAGArrowProps {
  status: ArrowStatus;
}

/**
 * Arrow indicator between DAG columns, colored by path status.
 *
 * @public
 */
export function DAGArrow({ status }: DAGArrowProps) {
  return (
    <span
      className={`${styles.arrow} ${styles[status]}`}
      data-testid="dag-arrow"
      aria-hidden="true"
    >
      →
    </span>
  );
}
