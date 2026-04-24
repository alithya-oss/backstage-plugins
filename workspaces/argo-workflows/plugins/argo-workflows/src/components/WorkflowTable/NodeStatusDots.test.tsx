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

// Default: configApiRef not available → falls back to 'dots' mode
describe('NodeStatusDots (dots mode — default)', () => {
  it('renders dots for nodes', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'a', phase: 'Succeeded' },
      { displayName: 'b', phase: 'Failed' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    expect(screen.getByTestId('node-status-dots')).toBeInTheDocument();
    expect(screen.getAllByTestId('node-dot')).toHaveLength(2);
  });

  it('shows overflow for >12 nodes', () => {
    const nodes = Array.from({ length: 15 }, (_, i) => ({
      displayName: `node-${i}`,
      phase: 'Succeeded' as const,
    }));
    render(<NodeStatusDots nodes={nodes} />);
    expect(screen.getAllByTestId('node-dot')).toHaveLength(10);
    expect(screen.getByTestId('node-dots-overflow')).toHaveTextContent(
      '+5 more',
    );
  });

  it('shows dash for empty nodes', () => {
    render(<NodeStatusDots nodes={[]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('has aria-label with phase counts', () => {
    const nodes: NodeStatusSummary[] = [
      { displayName: 'a', phase: 'Succeeded' },
      { displayName: 'b', phase: 'Failed' },
    ];
    render(<NodeStatusDots nodes={nodes} />);
    expect(screen.getByTestId('node-status-dots')).toHaveAttribute(
      'aria-label',
      'Node status: 1 succeeded, 1 failed',
    );
  });
});
