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

import { render, screen } from '@testing-library/react';
import type {
  LayoutEdge,
  NodeStatus,
} from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { DAGEdgeSVG } from './DAGEdgeSVG';

function makeNode(id: string, phase: string = 'Succeeded'): NodeStatus {
  return { id, displayName: id, type: 'Pod', phase: phase as any };
}

describe('DAGEdgeSVG', () => {
  it('renders SVG path for each edge', () => {
    const edges: LayoutEdge[] = [
      {
        source: 'a',
        target: 'b',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
      {
        source: 'b',
        target: 'c',
        points: [
          { x: 100, y: 0 },
          { x: 200, y: 0 },
        ],
      },
    ];
    const nodeMap = new Map<string, NodeStatus>([
      ['a', makeNode('a')],
      ['b', makeNode('b')],
    ]);
    render(
      <DAGEdgeSVG edges={edges} nodeMap={nodeMap} width={300} height={100} />,
    );
    const paths = screen.getAllByTestId('dag-edge-path');
    expect(paths).toHaveLength(2);
  });

  it('applies success class for Succeeded source', () => {
    const edges: LayoutEdge[] = [
      {
        source: 'a',
        target: 'b',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
    ];
    const nodeMap = new Map([['a', makeNode('a', 'Succeeded')]]);
    render(
      <DAGEdgeSVG edges={edges} nodeMap={nodeMap} width={200} height={100} />,
    );
    const path = screen.getByTestId('dag-edge-path');
    expect(path.getAttribute('class')).toContain('success');
  });

  it('applies danger class for Failed source', () => {
    const edges: LayoutEdge[] = [
      {
        source: 'a',
        target: 'b',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
    ];
    const nodeMap = new Map([['a', makeNode('a', 'Failed')]]);
    render(
      <DAGEdgeSVG edges={edges} nodeMap={nodeMap} width={200} height={100} />,
    );
    const path = screen.getByTestId('dag-edge-path');
    expect(path.getAttribute('class')).toContain('danger');
  });

  it('applies inactive class for Running source', () => {
    const edges: LayoutEdge[] = [
      {
        source: 'a',
        target: 'b',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      },
    ];
    const nodeMap = new Map([['a', makeNode('a', 'Running')]]);
    render(
      <DAGEdgeSVG edges={edges} nodeMap={nodeMap} width={200} height={100} />,
    );
    const path = screen.getByTestId('dag-edge-path');
    expect(path.getAttribute('class')).toContain('inactive');
  });

  it('renders correct SVG path d attribute', () => {
    const edges: LayoutEdge[] = [
      {
        source: 'a',
        target: 'b',
        points: [
          { x: 10, y: 20 },
          { x: 50, y: 30 },
          { x: 90, y: 20 },
        ],
      },
    ];
    const nodeMap = new Map([['a', makeNode('a')]]);
    render(
      <DAGEdgeSVG edges={edges} nodeMap={nodeMap} width={200} height={100} />,
    );
    const path = screen.getByTestId('dag-edge-path');
    expect(path.getAttribute('d')).toBe('M 10 20 L 50 30 L 90 20');
  });
});
