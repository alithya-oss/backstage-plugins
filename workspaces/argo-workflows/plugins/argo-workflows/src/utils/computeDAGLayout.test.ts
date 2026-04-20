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

import { computeDAGLayout } from './computeDAGLayout';
import type { NodeStatus } from '@backstage-community/plugin-argo-workflows-common';

function makeNode(
  id: string,
  overrides?: Partial<NodeStatus>,
): NodeStatus {
  return {
    id,
    displayName: id,
    type: 'Pod',
    phase: 'Succeeded',
    ...overrides,
  };
}

describe('computeDAGLayout', () => {
  it('returns empty layout for empty input', () => {
    const result = computeDAGLayout([]);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('returns empty layout for undefined input', () => {
    expect(computeDAGLayout(undefined as any)).toEqual({
      nodes: [],
      edges: [],
    });
  });

  it('handles single node — 1 positioned node, 0 edges', () => {
    const result = computeDAGLayout([makeNode('a')]);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('a');
    expect(result.nodes[0].data.id).toBe('a');
    expect(typeof result.nodes[0].x).toBe('number');
    expect(typeof result.nodes[0].y).toBe('number');
    expect(result.edges).toHaveLength(0);
  });

  it('handles linear workflow (A→B→C) — increasing x positions', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b', { children: ['c'] }),
      makeNode('c'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);

    const byId = new Map(result.nodes.map(n => [n.id, n]));
    expect(byId.get('a')!.x).toBeLessThan(byId.get('b')!.x);
    expect(byId.get('b')!.x).toBeLessThan(byId.get('c')!.x);
  });

  it('handles fan-out (A→B, A→C) — B and C at same rank', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b'),
      makeNode('c'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(2);

    const byId = new Map(result.nodes.map(n => [n.id, n]));
    expect(byId.get('b')!.x).toBeCloseTo(byId.get('c')!.x, 0);
    expect(byId.get('b')!.y).not.toBeCloseTo(byId.get('c')!.y, 0);
  });

  it('handles fan-in (A→C, B→C) — A and B at same rank', () => {
    const nodes = [
      makeNode('a', { children: ['c'] }),
      makeNode('b', { children: ['c'] }),
      makeNode('c'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.nodes).toHaveLength(3);

    const byId = new Map(result.nodes.map(n => [n.id, n]));
    expect(byId.get('a')!.x).toBeCloseTo(byId.get('b')!.x, 0);
    expect(byId.get('a')!.x).toBeLessThan(byId.get('c')!.x);
  });

  it('handles diamond (A→B, A→C, B→D, C→D) — 3 ranks', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b', { children: ['d'] }),
      makeNode('c', { children: ['d'] }),
      makeNode('d'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);

    const byId = new Map(result.nodes.map(n => [n.id, n]));
    expect(byId.get('a')!.x).toBeLessThan(byId.get('b')!.x);
    expect(byId.get('b')!.x).toBeLessThan(byId.get('d')!.x);
  });

  it('filters out boundary nodes', () => {
    const nodes = [
      makeNode('root', { type: 'DAG', children: ['a'] }),
      makeNode('a'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('a');
  });

  it('returns empty layout when all nodes are boundary', () => {
    const nodes = [
      makeNode('root', { type: 'DAG' }),
      makeNode('steps', { type: 'Steps' }),
    ];
    expect(computeDAGLayout(nodes)).toEqual({ nodes: [], edges: [] });
  });

  it('nodes have correct default width and height', () => {
    const result = computeDAGLayout([makeNode('a')]);
    expect(result.nodes[0].width).toBe(180);
    expect(result.nodes[0].height).toBe(60);
  });

  it('supports custom node dimensions via options', () => {
    const result = computeDAGLayout([makeNode('a')], {
      nodeWidth: 200,
      nodeHeight: 80,
    });
    expect(result.nodes[0].width).toBe(200);
    expect(result.nodes[0].height).toBe(80);
  });

  it('edges have source, target, and points', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b'),
    ];
    const result = computeDAGLayout(nodes);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].source).toBe('a');
    expect(result.edges[0].target).toBe('b');
    expect(Array.isArray(result.edges[0].points)).toBe(true);
    expect(result.edges[0].points.length).toBeGreaterThan(0);
  });

  it('preserves NodeStatus data in positioned nodes', () => {
    const node = makeNode('a', {
      displayName: 'build',
      phase: 'Failed',
      duration: 120,
    });
    const result = computeDAGLayout([node]);
    expect(result.nodes[0].data.displayName).toBe('build');
    expect(result.nodes[0].data.phase).toBe('Failed');
    expect(result.nodes[0].data.duration).toBe(120);
  });
});
