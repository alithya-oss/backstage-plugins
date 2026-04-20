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
import { DAGCardFlow } from './DAGCardFlow';

function makeNode(id: string, overrides?: Partial<NodeStatus>): NodeStatus {
  return {
    id,
    displayName: id,
    type: 'Pod',
    phase: 'Succeeded',
    ...overrides,
  };
}

describe('DAGCardFlow', () => {
  it('renders node cards for each execution node', () => {
    const nodes = [makeNode('a', { children: ['b'] }), makeNode('b')];
    render(<DAGCardFlow nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.getByTestId('dag-node-b')).toBeInTheDocument();
  });

  it('renders columns in topological order', () => {
    const nodes = [
      makeNode('a', { children: ['b'] }),
      makeNode('b', { children: ['c'] }),
      makeNode('c'),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    const flow = screen.getByTestId('dag-card-flow');
    const nodeElements = flow.querySelectorAll('[data-testid^="dag-node-"]');
    expect(nodeElements[0]).toHaveAttribute('data-testid', 'dag-node-a');
    expect(nodeElements[1]).toHaveAttribute('data-testid', 'dag-node-b');
    expect(nodeElements[2]).toHaveAttribute('data-testid', 'dag-node-c');
  });

  it('renders "parallel" label for columns with multiple nodes', () => {
    const nodes = [
      makeNode('a', { children: ['b', 'c'] }),
      makeNode('b'),
      makeNode('c'),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    expect(screen.getByText('parallel')).toBeInTheDocument();
  });

  it('does not render "parallel" label for single-node columns', () => {
    const nodes = [makeNode('a', { children: ['b'] }), makeNode('b')];
    render(<DAGCardFlow nodes={nodes} />);
    expect(screen.queryByText('parallel')).not.toBeInTheDocument();
  });

  it('renders arrows between columns', () => {
    const nodes = [makeNode('a', { children: ['b'] }), makeNode('b')];
    render(<DAGCardFlow nodes={nodes} />);
    const arrows = screen.getAllByTestId('dag-arrow');
    expect(arrows).toHaveLength(1);
  });

  it('handles empty nodes array', () => {
    render(<DAGCardFlow nodes={[]} />);
    expect(screen.getByTestId('dag-empty')).toBeInTheDocument();
    expect(
      screen.getByText('This workflow has no execution nodes.'),
    ).toBeInTheDocument();
  });

  it('calls onNodeClick when a card is clicked', () => {
    const onNodeClick = jest.fn();
    const nodes = [makeNode('a')];
    render(<DAGCardFlow nodes={nodes} onNodeClick={onNodeClick} />);
    fireEvent.click(screen.getByTestId('dag-node-a'));
    expect(onNodeClick).toHaveBeenCalledWith('a');
  });

  it('filters out boundary nodes', () => {
    const nodes = [
      makeNode('root', { type: 'DAG', children: ['a'] }),
      makeNode('a'),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    expect(screen.getByTestId('dag-node-a')).toBeInTheDocument();
    expect(screen.queryByTestId('dag-node-root')).not.toBeInTheDocument();
  });

  it('renders success arrows after succeeded columns', () => {
    const nodes = [
      makeNode('a', { phase: 'Succeeded', children: ['b'] }),
      makeNode('b', { phase: 'Succeeded' }),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    const arrow = screen.getByTestId('dag-arrow');
    expect(arrow.className).toContain('success');
  });

  it('renders danger arrows after failed columns', () => {
    const nodes = [
      makeNode('a', { phase: 'Failed', children: ['b'] }),
      makeNode('b', { phase: 'Succeeded' }),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    const arrow = screen.getByTestId('dag-arrow');
    expect(arrow.className).toContain('danger');
  });

  it('renders inactive arrows after running columns', () => {
    const nodes = [
      makeNode('a', { phase: 'Running', children: ['b'] }),
      makeNode('b', { phase: 'Pending' }),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    const arrow = screen.getByTestId('dag-arrow');
    expect(arrow.className).toContain('inactive');
  });

  it('container has role="group"', () => {
    const nodes = [makeNode('a')];
    render(<DAGCardFlow nodes={nodes} />);
    const flow = screen.getByTestId('dag-card-flow');
    expect(flow).toHaveAttribute('role', 'group');
  });

  it('container has aria-label with node count and phase summary', () => {
    const nodes = [
      makeNode('a', { phase: 'Succeeded', children: ['b'] }),
      makeNode('b', { phase: 'Failed' }),
    ];
    render(<DAGCardFlow nodes={nodes} />);
    const flow = screen.getByTestId('dag-card-flow');
    expect(flow).toHaveAttribute(
      'aria-label',
      'Workflow execution graph with 2 nodes: 1 succeeded, 1 failed',
    );
  });
});
