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

import { computeDAGColumns } from './computeDAGColumns';
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

describe('computeDAGColumns', () => {
  it('returns empty array for empty input', () => {
    expect(computeDAGColumns([])).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(computeDAGColumns(undefined as any)).toEqual([]);
  });

  it('handles single execution node', () => {
    const nodes = [makeNode('a')];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(1);
    expect(result[0].nodes[0].id).toBe('a');
    expect(result[0].isParallel).toBe(false);
  });

  it('handles linear workflow (A→B→C)', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b', { children: ['c'] }),
      makeNode('c'),
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(3);
    expect(result[0].nodes[0].id).toBe('a');
    expect(result[0].isParallel).toBe(false);
    expect(result[1].nodes[0].id).toBe('b');
    expect(result[1].isParallel).toBe(false);
    expect(result[2].nodes[0].id).toBe('c');
    expect(result[2].isParallel).toBe(false);
  });

  it('handles fan-out pattern (A→B, A→C)', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b'),
      makeNode('c'),
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].nodes).toHaveLength(1);
    expect(result[0].nodes[0].id).toBe('a');
    expect(result[0].isParallel).toBe(false);
    expect(result[1].nodes).toHaveLength(2);
    const col2Ids = result[1].nodes.map(n => n.id).sort();
    expect(col2Ids).toEqual(['b', 'c']);
    expect(result[1].isParallel).toBe(true);
  });

  it('handles fan-in pattern (A→C, B→C)', () => {
    const nodes = [
      makeNode('a', { children: ['c'] }),
      makeNode('b', { children: ['c'] }),
      makeNode('c'),
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].nodes).toHaveLength(2);
    const col1Ids = result[0].nodes.map(n => n.id).sort();
    expect(col1Ids).toEqual(['a', 'b']);
    expect(result[0].isParallel).toBe(true);
    expect(result[1].nodes).toHaveLength(1);
    expect(result[1].nodes[0].id).toBe('c');
    expect(result[1].isParallel).toBe(false);
  });

  it('handles diamond/fan-out-fan-in (A→B, A→C, B→D, C→D)', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b', { children: ['d'] }),
      makeNode('c', { children: ['d'] }),
      makeNode('d'),
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(3);
    expect(result[0].nodes[0].id).toBe('a');
    const col2Ids = result[1].nodes.map(n => n.id).sort();
    expect(col2Ids).toEqual(['b', 'c']);
    expect(result[1].isParallel).toBe(true);
    expect(result[2].nodes[0].id).toBe('d');
  });

  it('filters out boundary nodes (DAG, Steps, StepGroup)', () => {
    const nodes: NodeStatus[] = [
      makeNode('root', { type: 'DAG', children: ['a', 'b'] }),
      makeNode('steps', { type: 'Steps', children: ['a'] }),
      makeNode('group', { type: 'StepGroup', children: ['b'] }),
      makeNode('a', { children: ['b'] }),
      makeNode('b'),
    ];
    const result = computeDAGColumns(nodes);
    // Only execution nodes a and b should appear
    const allIds = result.flatMap(col => col.nodes.map(n => n.id));
    expect(allIds).not.toContain('root');
    expect(allIds).not.toContain('steps');
    expect(allIds).not.toContain('group');
    expect(allIds).toContain('a');
    expect(allIds).toContain('b');
  });

  it('returns empty array when all nodes are boundary nodes', () => {
    const nodes: NodeStatus[] = [
      makeNode('root', { type: 'DAG' }),
      makeNode('steps', { type: 'Steps' }),
      makeNode('group', { type: 'StepGroup' }),
    ];
    expect(computeDAGColumns(nodes)).toEqual([]);
  });

  it('handles nodes with no children (leaf nodes)', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b'),
      makeNode('c'), // orphan — no parent, no children
    ];
    const result = computeDAGColumns(nodes);
    // a and c are both roots (in-degree 0)
    const col1Ids = result[0].nodes.map(n => n.id).sort();
    expect(col1Ids).toEqual(['a', 'c']);
    expect(result[0].isParallel).toBe(true);
    expect(result[1].nodes[0].id).toBe('b');
  });

  it('handles children referencing non-existent IDs', () => {
    const nodes = [makeNode('a', { children: ['b', 'ghost'] }), makeNode('b')];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].nodes[0].id).toBe('a');
    expect(result[1].nodes[0].id).toBe('b');
  });

  it('handles nodes with undefined children arrays', () => {
    const nodes = [
      makeNode('a', { children: undefined }),
      makeNode('b', { children: ['a'] }), // b→a, so b is root
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(2);
    expect(result[0].nodes[0].id).toBe('b');
    expect(result[1].nodes[0].id).toBe('a');
  });

  it('preserves all NodeStatus fields in output nodes', () => {
    const nodes: NodeStatus[] = [
      {
        id: 'build-1',
        displayName: 'build',
        type: 'Pod',
        phase: 'Succeeded',
        startedAt: '2026-04-18T14:00:00Z',
        finishedAt: '2026-04-18T14:02:00Z',
        duration: 120,
        message: 'completed',
        templateName: 'build-template',
        children: [],
        outboundNodes: ['deploy-1'],
        boundaryID: 'root',
      },
    ];
    const result = computeDAGColumns(nodes);
    expect(result).toHaveLength(1);
    const node = result[0].nodes[0];
    expect(node.id).toBe('build-1');
    expect(node.displayName).toBe('build');
    expect(node.type).toBe('Pod');
    expect(node.phase).toBe('Succeeded');
    expect(node.startedAt).toBe('2026-04-18T14:00:00Z');
    expect(node.finishedAt).toBe('2026-04-18T14:02:00Z');
    expect(node.duration).toBe(120);
    expect(node.message).toBe('completed');
    expect(node.templateName).toBe('build-template');
    expect(node.outboundNodes).toEqual(['deploy-1']);
    expect(node.boundaryID).toBe('root');
  });
});
