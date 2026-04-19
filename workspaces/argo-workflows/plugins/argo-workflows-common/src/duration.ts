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


/**
 * Formats a duration in seconds into a human-readable string.
 *
 * - Hours + minutes: `"1h 5m"` (seconds dropped when hours present)
 * - Minutes + seconds: `"3m 47s"`
 * - Seconds only: `"12s"`
 * - Zero: `"0s"`
 * - Undefined or negative: `"—"`
 *
 * @param seconds - Duration in seconds, or undefined
 * @returns Formatted duration string
 * @public
 */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null || seconds < 0) {
    return '—';
  }

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}h ${m}m`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}
