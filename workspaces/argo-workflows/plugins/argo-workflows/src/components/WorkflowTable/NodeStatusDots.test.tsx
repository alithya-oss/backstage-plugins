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
import type { NodeStatusSummary } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { NodeStatusDots } from './NodeStatusDots';

function makeNodes(
  count: number,
  phase: string = 'Succeeded',
): NodeStatusSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    displayName: `node-${i + 1}`,
    phase: phase as NodeStatusSummary['phase'],
  }));
}

describe('NodeStatusDots', () => {
  it('renders one dot per node', () => {
    const nodes = makeNodes(5);
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots).toHaveLength(5);
  });

  it('renders correct phase icon character in each dot', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'a', phase: 'Succeeded' },
      { displayName: 'b', phase: 'Failed' },
      { displayName: 'c', phase: 'Running' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText('✗')).toBeInTheDocument();
    expect(screen.getByText('◌')).toBeInTheDocument();
  });

  it('each dot has title attribute with displayName and phase', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'build', phase: 'Succeeded' },
      { displayName: 'deploy', phase: 'Failed' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots[0]).toHaveAttribute('title', 'build: Succeeded');
    expect(dots[1]).toHaveAttribute('title', 'deploy: Failed');
  });

  it('shows overflow text when more than 12 nodes', () => {
    const nodes = makeNodes(15);
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots).toHaveLength(10);
    expect(screen.getByTestId('node-dots-overflow')).toHaveTextContent(
      '+5 more',
    );
  });

  it('shows all dots when exactly 12 nodes', () => {
    const nodes = makeNodes(12);
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots).toHaveLength(12);
    expect(screen.queryByTestId('node-dots-overflow')).not.toBeInTheDocument();
  });

  it('shows gray dash for empty nodes', () => {
    render(<NodeStatusDots nodes={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByTestId('node-dot')).not.toBeInTheDocument();
  });

  it('container has aria-label with phase counts', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'a', phase: 'Succeeded' },
      { displayName: 'b', phase: 'Succeeded' },
      { displayName: 'c', phase: 'Failed' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    const container = screen.getByLabelText(/Node status:/);
    expect(container).toHaveAttribute(
      'aria-label',
      'Node status: 2 succeeded, 1 failed',
    );
  });

  it('empty nodes has aria-label with none', () => {
    render(<NodeStatusDots nodes={[]} />);
    expect(screen.getByLabelText('Node status: none')).toBeInTheDocument();
  });

  it('single node renders one dot without overflow', () => {
    const nodes = makeNodes(1);
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots).toHaveLength(1);
    expect(screen.queryByTestId('node-dots-overflow')).not.toBeInTheDocument();
  });

  it('renders dots for all 7 phase types', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'a', phase: 'Succeeded' },
      { displayName: 'b', phase: 'Failed' },
      { displayName: 'c', phase: 'Error' },
      { displayName: 'd', phase: 'Running' },
      { displayName: 'e', phase: 'Pending' },
      { displayName: 'f', phase: 'Skipped' },
      { displayName: 'g', phase: 'Omitted' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    const dots = screen.getAllByTestId('node-dot');
    expect(dots).toHaveLength(7);
  });
});
