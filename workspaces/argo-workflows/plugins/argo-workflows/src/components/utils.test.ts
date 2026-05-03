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

import {
  ALL_STATUSES,
  formatDuration,
  formatDate,
  formatTimeAgo,
  workflowFullName,
} from './utils';
import type { WorkflowItem } from './utils';

function makeItem(
  overrides: Partial<{
    name: string;
    namespace: string;
    startedAt: string;
    finishedAt: string;
  }> = {},
): WorkflowItem {
  return {
    id: overrides.name ?? 'wf-1',
    metadata: {
      name: overrides.name ?? 'wf-1',
      namespace: overrides.namespace ?? 'default',
      uid: 'uid-1',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    status: {
      phase: 'Succeeded',
      startedAt: overrides.startedAt,
      finishedAt: overrides.finishedAt,
    },
  };
}

describe('ALL_STATUSES', () => {
  it('contains all five workflow statuses', () => {
    expect(ALL_STATUSES).toEqual([
      'Succeeded',
      'Failed',
      'Running',
      'Pending',
      'Error',
    ]);
  });
});

describe('formatDuration', () => {
  it('returns dash when startedAt is missing', () => {
    expect(formatDuration(undefined, '2024-01-01T00:01:00Z')).toBe('—');
  });

  it('returns dash when finishedAt is missing', () => {
    expect(formatDuration('2024-01-01T00:00:00Z', undefined)).toBe('—');
  });

  it('returns dash when both are missing', () => {
    expect(formatDuration()).toBe('—');
  });

  it('returns dash for negative duration', () => {
    expect(formatDuration('2024-01-01T00:01:00Z', '2024-01-01T00:00:00Z')).toBe(
      '—',
    );
  });

  it('formats seconds only', () => {
    expect(formatDuration('2024-01-01T00:00:00Z', '2024-01-01T00:00:45Z')).toBe(
      '45s',
    );
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration('2024-01-01T00:00:00Z', '2024-01-01T00:02:30Z')).toBe(
      '2m 30s',
    );
  });

  it('formats hours, minutes and seconds', () => {
    expect(formatDuration('2024-01-01T00:00:00Z', '2024-01-01T01:15:05Z')).toBe(
      '1h 15m 5s',
    );
  });

  it('formats zero seconds as 0s', () => {
    expect(formatDuration('2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')).toBe(
      '0s',
    );
  });
});

describe('formatDate', () => {
  it('returns dash when isoDate is undefined', () => {
    expect(formatDate()).toBe('—');
  });

  it('returns a localized string for a valid ISO date', () => {
    const result = formatDate('2024-06-15T10:30:00Z');
    // The exact format depends on locale, but it should be a non-empty string
    expect(result).not.toBe('—');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatTimeAgo', () => {
  it('returns "Updated just now" for recent dates', () => {
    const now = new Date();
    expect(formatTimeAgo(now)).toBe('Updated just now');
  });

  it('returns seconds ago for dates within a minute', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30_000);
    expect(formatTimeAgo(thirtySecondsAgo)).toBe('Updated 30s ago');
  });

  it('returns minutes ago for dates within an hour', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatTimeAgo(fiveMinutesAgo)).toBe('Updated 5m ago');
  });

  it('returns hours ago for older dates', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600_000);
    expect(formatTimeAgo(twoHoursAgo)).toBe('Updated 2h ago');
  });
});

describe('workflowFullName', () => {
  it('returns namespace/name', () => {
    const item = makeItem({ namespace: 'production', name: 'deploy-v42' });
    expect(workflowFullName(item)).toBe('production/deploy-v42');
  });

  it('uses default namespace', () => {
    const item = makeItem({ name: 'my-wf' });
    expect(workflowFullName(item)).toBe('default/my-wf');
  });
});
