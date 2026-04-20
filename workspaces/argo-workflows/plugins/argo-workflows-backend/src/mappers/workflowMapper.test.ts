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
  mapCrdToWorkflowDetail,
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
          group: {
            displayName: 'group',
            type: 'StepGroup',
            phase: 'Succeeded',
          },
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
        nodes: {
          n1: 'not-an-object',
          n2: null,
          n3: { type: 'Pod', displayName: 'ok', phase: 'Succeeded' },
        },
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

const detailCrd = {
  metadata: {
    name: 'pipeline-abc',
    namespace: 'production',
    labels: { app: 'payment' },
    creationTimestamp: '2026-04-18T14:00:00Z',
  },
  status: {
    phase: 'Failed',
    startedAt: '2026-04-18T14:00:00Z',
    finishedAt: '2026-04-18T14:05:30Z',
    nodes: {
      'pipeline-abc': {
        displayName: 'pipeline-abc',
        type: 'DAG',
        phase: 'Failed',
        startedAt: '2026-04-18T14:00:00Z',
        finishedAt: '2026-04-18T14:05:30Z',
        children: ['pipeline-abc-build-123', 'pipeline-abc-test-456'],
        outboundNodes: ['pipeline-abc-deploy-789'],
        boundaryID: '',
      },
      'pipeline-abc-build-123': {
        displayName: 'build',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-18T14:00:05Z',
        finishedAt: '2026-04-18T14:02:00Z',
        templateName: 'build-template',
        children: ['pipeline-abc-deploy-789'],
        boundaryID: 'pipeline-abc',
      },
      'pipeline-abc-test-456': {
        displayName: 'test',
        type: 'Pod',
        phase: 'Failed',
        startedAt: '2026-04-18T14:00:05Z',
        finishedAt: '2026-04-18T14:03:00Z',
        message: 'exit code 1: test suite failed',
        templateName: 'test-template',
        boundaryID: 'pipeline-abc',
      },
      'pipeline-abc-deploy-789': {
        displayName: 'deploy',
        type: 'Pod',
        phase: 'Omitted',
        boundaryID: 'pipeline-abc',
      },
    },
  },
};

describe('mapCrdToWorkflowDetail', () => {
  it('maps complete CRD with all node fields', () => {
    const result = mapCrdToWorkflowDetail(detailCrd);

    expect(result.name).toBe('pipeline-abc');
    expect(result.namespace).toBe('production');
    expect(result.phase).toBe('Failed');
    expect(result.nodes).toHaveLength(4);

    const buildNode = result.nodes.find(n => n.id === 'pipeline-abc-build-123');
    expect(buildNode).toEqual({
      id: 'pipeline-abc-build-123',
      displayName: 'build',
      type: 'Pod',
      phase: 'Succeeded',
      startedAt: '2026-04-18T14:00:05Z',
      finishedAt: '2026-04-18T14:02:00Z',
      duration: 115,
      message: undefined,
      templateName: 'build-template',
      children: ['pipeline-abc-deploy-789'],
      outboundNodes: undefined,
      boundaryID: 'pipeline-abc',
    });
  });

  it('includes boundary nodes (DAG, Steps, StepGroup) in output', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          root: { displayName: 'root', type: 'DAG', phase: 'Succeeded' },
          steps: { displayName: 'steps', type: 'Steps', phase: 'Succeeded' },
          group: {
            displayName: 'group',
            type: 'StepGroup',
            phase: 'Succeeded',
          },
          pod: { displayName: 'run', type: 'Pod', phase: 'Succeeded' },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes).toHaveLength(4);

    const types = result.nodes.map(n => n.type);
    expect(types).toContain('DAG');
    expect(types).toContain('Steps');
    expect(types).toContain('StepGroup');
    expect(types).toContain('Pod');
  });

  it('handles missing status.nodes — returns empty nodes array', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: { phase: 'Running', startedAt: '2026-04-18T10:00:00Z' },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes).toEqual([]);
  });

  it('handles empty status.nodes map — returns empty nodes array', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {},
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes).toEqual([]);
  });

  it('handles partial node data (missing optional fields)', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: { displayName: 'step', type: 'Pod', phase: 'Running' },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.id).toBe('n1');
    expect(node.message).toBeUndefined();
    expect(node.templateName).toBeUndefined();
    expect(node.children).toBeUndefined();
    expect(node.outboundNodes).toBeUndefined();
    expect(node.boundaryID).toBeUndefined();
    expect(node.startedAt).toBeUndefined();
    expect(node.finishedAt).toBeUndefined();
    expect(node.duration).toBeUndefined();
  });

  it('defaults invalid node phase to Pending', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: { displayName: 'step', type: 'Pod', phase: 'BogusPhase' },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes[0].phase).toBe('Pending');
  });

  it('defaults invalid node type to Pod', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: { displayName: 'step', type: 'UnknownType', phase: 'Running' },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes[0].type).toBe('Pod');
  });

  it('computes per-node duration from startedAt/finishedAt', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Succeeded',
        startedAt: '2026-04-18T10:00:00Z',
        finishedAt: '2026-04-18T10:10:00Z',
        nodes: {
          n1: {
            displayName: 'step',
            type: 'Pod',
            phase: 'Succeeded',
            startedAt: '2026-04-18T10:00:00Z',
            finishedAt: '2026-04-18T10:03:47Z',
          },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes[0].duration).toBe(227);
  });

  it('returns undefined duration for nodes without finishedAt', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: {
            displayName: 'step',
            type: 'Pod',
            phase: 'Running',
            startedAt: '2026-04-18T10:00:00Z',
          },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes[0].duration).toBeUndefined();
  });

  it('handles malformed node entries (null, non-object) gracefully', () => {
    const crd = {
      metadata: { name: 'wf', namespace: 'ns' },
      status: {
        phase: 'Running',
        startedAt: '2026-04-18T10:00:00Z',
        nodes: {
          n1: null,
          n2: 'string-value',
          n3: 42,
          n4: { displayName: 'valid', type: 'Pod', phase: 'Succeeded' },
        },
      },
    };
    const result = mapCrdToWorkflowDetail(crd);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('n4');
  });

  it('maps top-level workflow fields correctly (reuses summary logic)', () => {
    const result = mapCrdToWorkflowDetail(detailCrd);
    expect(result.name).toBe('pipeline-abc');
    expect(result.namespace).toBe('production');
    expect(result.phase).toBe('Failed');
    expect(result.startedAt).toBe('2026-04-18T14:00:00Z');
    expect(result.finishedAt).toBe('2026-04-18T14:05:30Z');
    expect(result.duration).toBe(330);
    expect(result.labels).toEqual({ app: 'payment' });
  });

  it('uses node map keys as node IDs', () => {
    const result = mapCrdToWorkflowDetail(detailCrd);
    const ids = result.nodes.map(n => n.id);
    expect(ids).toContain('pipeline-abc');
    expect(ids).toContain('pipeline-abc-build-123');
    expect(ids).toContain('pipeline-abc-test-456');
    expect(ids).toContain('pipeline-abc-deploy-789');
  });

  it('includes message field for failed nodes', () => {
    const result = mapCrdToWorkflowDetail(detailCrd);
    const failedNode = result.nodes.find(n => n.id === 'pipeline-abc-test-456');
    expect(failedNode?.message).toBe('exit code 1: test suite failed');
  });
});
