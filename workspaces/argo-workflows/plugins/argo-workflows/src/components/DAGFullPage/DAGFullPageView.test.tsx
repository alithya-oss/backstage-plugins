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
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DAGFullPageView } from './DAGFullPageView';

jest.mock('../../hooks', () => ({
  useWorkflowDetail: jest.fn(),
}));

jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ nodes, edges, children }: any) => (
    <div data-testid="mock-react-flow">
      <span data-testid="rf-node-count">{nodes?.length ?? 0}</span>
      <span data-testid="rf-edge-count">{edges?.length ?? 0}</span>
      {children}
    </div>
  ),
  MiniMap: () => <div data-testid="mock-minimap" />,
  Controls: () => <div data-testid="mock-controls" />,
  Handle: () => null,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  getSmoothStepPath: () => ['M 0 0 L 100 0'],
}));

jest.mock('../NodeDetailPanel', () => ({
  NodeDetailPanel: ({ node }: any) => (
    <div data-testid="mock-panel">{node.displayName}</div>
  ),
}));

jest.mock('../DAGCardFlow/DAGNodeCard', () => ({
  DAGNodeCard: ({ node }: any) => (
    <div data-testid={`dag-node-${node.id}`}>{node.displayName}</div>
  ),
}));

const { useWorkflowDetail } = require('../../hooks');

function renderWithRouter(namespace: string, name: string) {
  return render(
    <MemoryRouter initialEntries={[`/${namespace}/${name}/dag`]}>
      <Routes>
        <Route path="/:namespace/:name/dag" element={<DAGFullPageView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('DAGFullPageView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: true,
      error: null,
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByText('Loading workflow…')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: null,
      loading: false,
      error: new Error('Not found'),
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByText(/Not found/)).toBeInTheDocument();
  });

  it('renders back button', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        name: 'my-workflow',
        namespace: 'production',
        phase: 'Succeeded',
        startedAt: '2026-04-19T10:00:00Z',
        nodes: [
          { id: 'a', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  it('renders ReactFlow with nodes and edges', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        name: 'my-workflow',
        namespace: 'production',
        phase: 'Succeeded',
        startedAt: '2026-04-19T10:00:00Z',
        nodes: [
          {
            id: 'a',
            displayName: 'build',
            type: 'Pod',
            phase: 'Succeeded',
            children: ['b'],
          },
          { id: 'b', displayName: 'deploy', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByTestId('mock-react-flow')).toBeInTheDocument();
    expect(screen.getByTestId('rf-node-count')).toHaveTextContent('2');
    expect(screen.getByTestId('rf-edge-count')).toHaveTextContent('1');
  });

  it('renders MiniMap and Controls', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        name: 'my-workflow',
        namespace: 'production',
        phase: 'Succeeded',
        startedAt: '2026-04-19T10:00:00Z',
        nodes: [
          { id: 'a', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByTestId('mock-minimap')).toBeInTheDocument();
    expect(screen.getByTestId('mock-controls')).toBeInTheDocument();
  });

  it('renders workflow name in title', () => {
    useWorkflowDetail.mockReturnValue({
      workflow: {
        name: 'my-workflow',
        namespace: 'production',
        phase: 'Succeeded',
        startedAt: '2026-04-19T10:00:00Z',
        nodes: [
          { id: 'a', displayName: 'build', type: 'Pod', phase: 'Succeeded' },
        ],
      },
      loading: false,
      error: null,
    });
    renderWithRouter('production', 'my-workflow');
    expect(screen.getByText('my-workflow')).toBeInTheDocument();
  });
});
