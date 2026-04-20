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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { NodeStatus } from '@backstage-community/plugin-argo-workflows-common';
import { DAGFlowView } from './DAGFlowView';

function makeNode(id: string, overrides?: Partial<NodeStatus>): NodeStatus {
  return {
    id,
    displayName: id,
    type: 'Pod',
    phase: 'Succeeded',
    ...overrides,
  };
}

describe('DAGFlowView', () => {
  it('renders node cards for execution nodes', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b'),
    ];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-b')).toBeInTheDocument();
  });

  it('renders SVG edges between nodes', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b'),
    ];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getByTestId('dag-edge-svg')).toBeInTheDocument();
    expect(screen.getAllByTestId('dag-edge-path')).toHaveLength(1);
  });

  it('handles empty nodes array', () => {
    render(<DAGFlowView nodes={[]} />);
    expect(screen.getByTestId('dag-empty')).toBeInTheDocument();
    expect(screen.getByText('This workflow has no execution nodes.')).toBeInTheDocument();
  });

  it('passes selectedNodeId to node cards', () => {
    const nodes = [makeNode('a')];
    render(<DAGFlowView nodes={nodes} selectedNodeId="a" />);
    const card = screen.getByTestId('dag-node-a');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onNodeClick when node card is clicked', () => {
    const onNodeClick = jest.fn();
    const nodes = [makeNode('a')];
    render(<DAGFlowView nodes={nodes} onNodeClick={onNodeClick} />);
    fireEvent.click(screen.getByTestId('dag-node-a'));
    expect(onNodeClick).toHaveBeenCalledWith('a');
  });

  it('container has aria-label with node count and phase summary', () => {
    const nodes = [
      makeNode('a', { phase: 'Succeeded' }),
      makeNode('b', { phase: 'Failed' }),
    ];
    render(<DAGFlowView nodes={nodes} />);
    const container = screen.getByTestId('dag-flow-view');
    expect(container).toHaveAttribute(
      'aria-label',
      expect.stringContaining('2 nodes'),
    );
  });

  it('filters out boundary nodes', () => {
    const nodes = [
      makeNode('root', { type: 'DAG', children: ['a'] }),
      makeNode('a'),
    ];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.queryByTestId('dag-node-root')).not.toBeInTheDocument();
  });

  it('renders multiple edges for diamond pattern', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b', { children: ['d'] }),
      makeNode('c', { children: ['d'] }),
      makeNode('d'),
    ];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getAllByTestId('dag-edge-path')).toHaveLength(4);
  });
});
