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

import { decompressNodes } from './decompressNodes';
import type { NodeStatus } from './types';

function makeNode(id: string, overrides?: Partial<NodeStatus>): NodeStatus {
  return {
    id,
    displayName: id,
    type: 'Pod',
    phase: 'Succeeded',
    ...overrides,
  };
}

describe('decompressNodes', () => {
  it('returns empty result for empty input', () => {
    const result = decompressNodes([]);
    expect(result.groups).toEqual([]);
    expect(result.executionNodes).toEqual([]);
  });

  it('returns empty result for undefined input', () => {
    expect(decompressNodes(undefined as any)).toEqual({
      groups: [],
      executionNodes: [],
    });
  });

  it('flat workflow — no boundary nodes, all execution nodes', () => {
    const nodes = [makeNode('a'), makeNode('b')];
    const result = decompressNodes(nodes);
    expect(result.groups).toHaveLength(0);
    expect(result.executionNodes).toHaveLength(2);
  });

  it('single-level nesting — DAG with two child pods', () => {
    const nodes = [
      makeNode('dag-root', { type: 'DAG' }),
      makeNode('build', { boundaryID: 'dag-root' }),
      makeNode('deploy', { boundaryID: 'dag-root' }),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].id).toBe('dag-root');
    expect(result.groups[0].type).toBe('DAG');
    expect(result.groups[0].childNodeIds).toEqual(['build', 'deploy']);
    expect(result.groups[0].parentId).toBeUndefined();
    expect(result.executionNodes).toHaveLength(2);
  });

  it('multi-level nesting — DAG → Steps → StepGroup → Pod', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('steps', { type: 'Steps', boundaryID: 'dag' }),
      makeNode('group', { type: 'StepGroup', boundaryID: 'steps' }),
      makeNode('pod', { boundaryID: 'group' }),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups).toHaveLength(3);

    const dagGroup = result.groups.find(g => g.id === 'dag')!;
    expect(dagGroup.parentId).toBeUndefined();
    expect(dagGroup.childNodeIds).toEqual([]);

    const stepsGroup = result.groups.find(g => g.id === 'steps')!;
    expect(stepsGroup.parentId).toBe('dag');

    const stepGroupGroup = result.groups.find(g => g.id === 'group')!;
    expect(stepGroupGroup.parentId).toBe('steps');
    expect(stepGroupGroup.childNodeIds).toEqual(['pod']);

    expect(result.executionNodes).toHaveLength(1);
    expect(result.executionNodes[0].id).toBe('pod');
  });

  it('orphan nodes — no boundaryID', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('inside', { boundaryID: 'dag' }),
      makeNode('orphan'), // no boundaryID
    ];
    const result = decompressNodes(nodes);
    expect(result.executionNodes).toHaveLength(2);
    const dagGroup = result.groups.find(g => g.id === 'dag')!;
    expect(dagGroup.childNodeIds).toEqual(['inside']);
    // orphan is in executionNodes but not in any group's childNodeIds
    expect(dagGroup.childNodeIds).not.toContain('orphan');
  });

  it('group phase aggregation — Failed child makes group Failed', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('a', { phase: 'Succeeded', boundaryID: 'dag' }),
      makeNode('b', { phase: 'Failed', boundaryID: 'dag' }),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups[0].phase).toBe('Failed');
  });

  it('group phase aggregation — all Succeeded', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('a', { phase: 'Succeeded', boundaryID: 'dag' }),
      makeNode('b', { phase: 'Succeeded', boundaryID: 'dag' }),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups[0].phase).toBe('Succeeded');
  });

  it('group phase aggregation — Running child', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('a', { phase: 'Succeeded', boundaryID: 'dag' }),
      makeNode('b', { phase: 'Running', boundaryID: 'dag' }),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups[0].phase).toBe('Running');
  });

  it('group phase aggregation — no children defaults to Pending', () => {
    const nodes = [makeNode('dag', { type: 'DAG' })];
    const result = decompressNodes(nodes);
    expect(result.groups[0].phase).toBe('Pending');
  });

  it('mixed — some nodes in groups, some orphans', () => {
    const nodes = [
      makeNode('dag', { type: 'DAG' }),
      makeNode('grouped', { boundaryID: 'dag' }),
      makeNode('orphan-1'),
      makeNode('orphan-2'),
    ];
    const result = decompressNodes(nodes);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].childNodeIds).toEqual(['grouped']);
    expect(result.executionNodes).toHaveLength(3);
  });
});
