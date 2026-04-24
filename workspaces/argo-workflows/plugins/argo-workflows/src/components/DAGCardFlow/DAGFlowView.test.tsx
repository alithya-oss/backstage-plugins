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

import { render, screen, fireEvent } from '@testing-library/react';
import type { NodeStatus } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { DAGFlowView } from './DAGFlowView';

// jsdom does not provide ResizeObserver; polyfill for @xyflow/react
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any;
});

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
    const nodes = [makeNode('a', { children: ['b'] }), makeNode('b')];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-b')).toBeInTheDocument();
  });

  it('renders edge container for connected nodes', () => {
    const nodes = [makeNode('a', { children: ['b'] }), makeNode('b')];
    render(<DAGFlowView nodes={nodes} />);
    // React Flow renders an edges container; actual SVG paths require
    // DOM measurements unavailable in jsdom, so we verify the container exists.
    const edgesContainer = document.querySelector('.react-flow__edges');
    expect(edgesContainer).toBeInTheDocument();
  });

  it('handles empty nodes array', () => {
    render(<DAGFlowView nodes={[]} />);
    expect(screen.getByTestId('dag-empty')).toBeInTheDocument();
    expect(
      screen.getByText('This workflow has no execution nodes.'),
    ).toBeInTheDocument();
  });

  it('applies selected class when selectedNodeId matches', () => {
    const nodes = [makeNode('a')];
    render(<DAGFlowView nodes={nodes} selectedNodeId="a" />);
    const card = screen.getByTestId('dag-node-a');
    expect(card.className).toContain('pillSelected');
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

  it('renders all execution nodes for diamond pattern', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b', { children: ['d'] }),
      makeNode('c', { children: ['d'] }),
      makeNode('d'),
    ];
    render(<DAGFlowView nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-b')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-c')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-d')).toBeInTheDocument();
  });
});
