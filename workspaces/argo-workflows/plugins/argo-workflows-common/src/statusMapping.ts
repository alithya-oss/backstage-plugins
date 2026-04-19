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


import { NodePhase } from './types';

/**
 * BUI status token type used for mapping Argo phases to Backstage UI status indicators.
 * @public
 */
export type BUIStatus = 'success' | 'danger' | 'warning' | 'info' | 'secondary';

/**
 * Maps each Argo Workflow node phase to a BUI status string.
 * Single source of truth — all components must import from here.
 * @public
 */
export const PHASE_STATUS_MAP: Record<NodePhase, BUIStatus> = {
  Succeeded: 'success',
  Failed: 'danger',
  Error: 'danger',
  Running: 'info',
  Pending: 'warning',
  Skipped: 'secondary',
  Omitted: 'secondary',
};

/**
 * Maps each Argo Workflow node phase to an icon character.
 * Single source of truth — all components must import from here.
 * @public
 */
export const PHASE_ICON_MAP: Record<NodePhase, string> = {
  Succeeded: '✓',
  Failed: '✗',
  Error: '⚠',
  Running: '◌',
  Pending: '○',
  Skipped: '⊘',
  Omitted: '—',
};
