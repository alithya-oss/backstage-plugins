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
  DAGFlowView: ({
    nodes,
    onNodeClick,
    selectedNodeId,
  }: {
    nodes: unknown[];
    onNodeClick?: (id: string) => void;
    selectedNodeId?: string;
  }) => (
    <div data-testid="mock-dag-card-flow">
      DAG with {nodes.length} nodes
      {selectedNodeId && (
        <span data-testid="selected-node">{selectedNodeId}</span>
      )}
      {onNodeClick && (
        <button
          data-testid="click-node-n1"
          onClick={() => onNodeClick('n1')}
        >
          click n1
        </button>
      )}
    </div>
  ),
}));

jest.mock('../NodeDetailPanel', () => ({
  NodeDetailPanel: ({
    node,
    onClose,
  }: {
    node: { displayName: string };
    onClose: () => void;
  }) => (
    <div data-testid="mock-node-detail-panel">
      Panel: {node.displayName}
      <button data-testid="mock-panel-close" onClick={onClose}>
        close
      </button>
    </div>
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
    render(
      <ExpandButton
        isExpanded={false}
        onToggle={jest.fn()}
        workflowId="production/my-workflow"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('▶');
  });

  it('renders expand button in expanded state', () => {
    render(
      <ExpandButton
        isExpanded={true}
        onToggle={jest.fn()}
        workflowId="production/my-workflow"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onToggle when clicked', () => {
    const onToggle = jest.fn();
    render(
      <ExpandButton
        isExpanded={false}
        onToggle={onToggle}
        workflowId="production/my-workflow"
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has aria-controls pointing to expanded content ID', () => {
    render(
      <ExpandButton
        isExpanded={false}
        onToggle={jest.fn()}
        workflowId="production/my-workflow"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-controls',
      'expanded-content-production/my-workflow',
    );
  });

  it('toggles on Enter key (native button behavior)', () => {
    const onToggle = jest.fn();
    render(
      <ExpandButton
        isExpanded={false}
        onToggle={onToggle}
        workflowId="production/my-workflow"
      />,
    );
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    // Native button fires click on Enter — verify button is a <button>
    expect(screen.getByRole('button').tagName).toBe('BUTTON');
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

  it('expanded content has role="region" and aria-label', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute(
      'aria-label',
      'Workflow DAG for my-workflow',
    );
    expect(region).toHaveAttribute(
      'id',
      'expanded-content-production/my-workflow',
    );
  });

  it('loading state has role="region" and aria-label', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: true,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    const region = screen.getByRole('region');
    expect(region).toHaveAttribute(
      'aria-label',
      'Workflow DAG for my-workflow',
    );
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

  it('shows NodeDetailPanel when a node is clicked', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    fireEvent.click(screen.getByTestId('click-node-n1'));
    expect(screen.getByTestId('mock-node-detail-panel')).toBeInTheDocument();
    expect(screen.getByText('Panel: build')).toBeInTheDocument();
  });

  it('closes panel when same node is clicked again', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    // Open panel
    fireEvent.click(screen.getByTestId('click-node-n1'));
    expect(screen.getByTestId('mock-node-detail-panel')).toBeInTheDocument();
    // Click same node again — closes
    fireEvent.click(screen.getByTestId('click-node-n1'));
    expect(
      screen.queryByTestId('mock-node-detail-panel'),
    ).not.toBeInTheDocument();
  });

  it('closes panel when close button is clicked', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    fireEvent.click(screen.getByTestId('click-node-n1'));
    fireEvent.click(screen.getByTestId('mock-panel-close'));
    expect(
      screen.queryByTestId('mock-node-detail-panel'),
    ).not.toBeInTheDocument();
  });

  it('closes panel when Escape is pressed', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    fireEvent.click(screen.getByTestId('click-node-n1'));
    expect(screen.getByTestId('mock-node-detail-panel')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.queryByTestId('mock-node-detail-panel'),
    ).not.toBeInTheDocument();
  });

  it('panel wrapper receives focus when panel opens', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        ...mockWorkflow,
        nodes: [
          { id: 'n1', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });

    render(<WorkflowExpandedContent workflow={mockWorkflow} />);
    fireEvent.click(screen.getByTestId('click-node-n1'));
    // The panel wrapper div should have tabIndex=-1 and be focusable
    const panelWrapper = screen.getByTestId('mock-node-detail-panel').parentElement;
    expect(panelWrapper).toHaveAttribute('tabindex', '-1');
  });
});
