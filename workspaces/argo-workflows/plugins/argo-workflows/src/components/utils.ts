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

import type { Workflow } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import type { WorkflowStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';

/** Table item type — extends Workflow with a required `id` and source instance. */
export interface WorkflowItem extends Workflow {
  id: string;
  /** The instance this workflow was fetched from. */
  sourceInstance?: string;
}

/** All possible workflow status values for the filter toggles. */
export const ALL_STATUSES: WorkflowStatus[] = [
  'Succeeded',
  'Failed',
  'Running',
  'Pending',
  'Error',
];

/**
 * Formats a duration between two ISO date strings into a human-readable string.
 */
export function formatDuration(
  startedAt?: string,
  finishedAt?: string,
): string {
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
export function formatDate(isoDate?: string): string {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleString();
}

/**
 * Returns a human-readable relative time string (e.g. "Updated just now").
 */
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

/**
 * Returns the full qualified name of a workflow: `namespace/name`.
 */
export function workflowFullName(item: WorkflowItem): string {
  return `${item.metadata.namespace}/${item.metadata.name}`;
}
