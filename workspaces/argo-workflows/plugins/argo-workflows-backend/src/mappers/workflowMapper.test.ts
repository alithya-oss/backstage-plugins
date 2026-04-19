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
  mapCrdToWorkflowSummary,
  mapCrdListToWorkflowSummaries,
} from './workflowMapper';

const fullCrd = {
  metadata: {
    name: 'my-workflow-abc',
    namespace: 'production',
    labels: { app: 'my-service' },
    creationTimestamp: '2026-04-18T14:22:54Z',
  },
  status: {
    phase: 'Succeeded',
    startedAt: '2026-04-18T14:22:54Z',
    finishedAt: '2026-04-18T14:26:41Z',
    nodes: {
      root: {
        id: 'root',
        displayName: 'my-workflow-abc',
        type: 'DAG',
        phase: 'Succeeded',
      },
      step1: {
        id: 'step1',
        displayName: 'build',
        type: 'Pod',
        phase: 'Succeeded',
      },
      step2: {
        id: 'step2',
        displayName: 'test',
        type: 'Pod',
        phase: 'Failed',
      },
    },
  },
};

describe('mapCrdToWorkflowSummary', () => {
  it('maps a complete CRD with all fields', () => {
    const result = mapCrdToWorkflowSummary(fullCrd);
    expect(result.name).toBe('my-workflow-abc');
    expect(result.namespace).toBe('production');
    expect(result.phase).toBe('Succeeded');
    expect(result.startedAt).toBe('2026-04-18T14:22:54Z');
    expect(result.finishedAt).toBe('2026-04-18T14:26:41Z');
    expect(result.duration).toBe(227);
    expect(result.labels).toEqual({ app: 'my-service' });
  });

  it('extracts NodeStatusSummary excluding boundary nodes', () => {
    const result = mapCrdToWorkflowSummary(fullCrd);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes).toEqual([
      { displayName: 'build', phase: 'Succeeded' },
      { displayName: 'test', phase: 'Failed' },
    ]);
  });

  it('handles missing status (brand new workflow)', () => {
    const crd = {
      metadata: {
        name: 'new-wf',
        namespace: 'default',
        creationTimestamp: '2026-04-18T10:00:00Z',
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.phase).toBe('Pending');
    expect(result.startedAt).toBe('2026-04-18T10:00:00Z');
    expect(result.finishedAt).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.nodes).toEqual([]);
  });

  it('handles missing status.nodes', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.nodes).toEqual([]);
  });

  it('handles empty status.nodes map', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {},
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.nodes).toEqual([]);
  });

  it('computes duration when finishedAt is present', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        finishedAt: '2026-04-18T10:05:30Z',
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.duration).toBe(330);
  });

  it('returns undefined duration for running workflow', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.duration).toBeUndefined();
  });

  it('defaults invalid phase to Pending', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: { phase: 'Unknown' },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.phase).toBe('Pending');
  });

  it('handles completely malformed CRD data', () => {
    const result = mapCrdToWorkflowSummary({});
    expect(result.name).toBe('');
    expect(result.namespace).toBe('');
    expect(result.phase).toBe('Pending');
    expect(result.nodes).toEqual([]);
  });

  it('handles null input', () => {
    const result = mapCrdToWorkflowSummary(null);
    expect(result.name).toBe('');
    expect(result.phase).toBe('Pending');
  });

  it('filters out Steps and StepGroup boundary nodes', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          root: { displayName: 'root', type: 'Steps', phase: 'Succeeded' },
          group: { displayName: 'group', type: 'StepGroup', phase: 'Succeeded' },
          pod: { displayName: 'run', type: 'Pod', phase: 'Succeeded' },
        },
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.nodes).toEqual([{ displayName: 'run', phase: 'Succeeded' }]);
  });

  it('defaults invalid node phase to Pending', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: { displayName: 'step', type: 'Pod', phase: 'InvalidPhase' },
        },
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.nodes[0].phase).toBe('Pending');
  });

  it('handles null labels gracefully', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns', labels: null },
      status: { phase: 'Succeeded', startedAt: '2026-04-18T10:00:00Z' },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.labels).toBeUndefined();
  });

  it('handles non-object nodes gracefully', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: { n1: 'not-an-object', n2: null, n3: { type: 'Pod', displayName: 'ok', phase: 'Succeeded' } },
      },
    };
    const result = mapCrdToWorkflowSummary(crd);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].displayName).toBe('ok');
  });
});

describe('mapCrdListToWorkflowSummaries', () => {
  it('maps multiple CRDs', () => {
    const list = {
      items: [fullCrd, { metadata: { name: 'wf2', namespace: 'ns' } }],
    };
    const result = mapCrdListToWorkflowSummaries(list);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('my-workflow-abc');
    expect(result[1].name).toBe('wf2');
  });

  it('returns empty array for missing items', () => {
    expect(mapCrdListToWorkflowSummaries({})).toEqual([]);
    expect(mapCrdListToWorkflowSummaries(null)).toEqual([]);
  });

  it('returns empty array for non-array items', () => {
    expect(mapCrdListToWorkflowSummaries({ items: 'bad' })).toEqual([]);
  });
});
