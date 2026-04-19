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
import type { WorkflowSummary } from '@backstage-community/plugin-argo-workflows-common';
import {
  ExpandButton,
  WorkflowExpandedContent,
} from './WorkflowExpandableRow';

jest.mock('../../hooks', () => ({
  useWorkflowDetail: jest.fn(),
}));

jest.mock('../DAGCardFlow', () => ({
  DAGCardFlow: ({ nodes }: { nodes: unknown[] }) => (
    <div data-testid="mock-dag-card-flow">DAG with {nodes.length} nodes</div>
  ),
}));

const { useWorkflowDetail } = require('../../hooks');

const mockWorkflow: WorkflowSummary = {
  name: 'my-workflow',
  namespace: 'production',
  phase: 'Succeeded',
  startedAt: '2026-04-18T10:00:00Z',
  nodes: [],
};

describe('ExpandButton', () => {
  it('renders expand button in collapsed state', () => {
    render(<ExpandButton isExpanded={false} onToggle={jest.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('▶');
  });

  it('renders expand button in expanded state', () => {
    render(<ExpandButton isExpanded={true} onToggle={jest.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(<ExpandButton isExpanded={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('WorkflowExpandedContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading skeleton when loading', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: true,
      error: null,
    });

    const { container } = render(
      <WorkflowExpandedContent workflow={mockWorkflow} />,
    );
    // Skeleton cards should be present
    expect(container.querySelectorAll('[class*="skeletonCard"]').length).toBeGreaterThan(0);
  });

  it('shows error message when error occurs', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: false,
      error: new Error('Network failure'),
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    expect(screen.getByText(/Network failure/)).toBeInTheDocument();
  });

  it('renders DAGCardFlow when loaded', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
          { id: 'n2', displayName: 'deploy', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    expect(screen.getByTestId('mock-dag-card-flow')).toBeInTheDocument();
    expect(screen.getByText('DAG with 2 nodes')).toBeInTheDocument();
  });

  it('renders nothing when no detail and not loading', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: false,
      error: null,
    });

    const { container } = render(
      <WorkflowExpandedContent workflow={mockWorkflow} />,
    );
    expect(container.innerHTML).toBe('');
  });
});
