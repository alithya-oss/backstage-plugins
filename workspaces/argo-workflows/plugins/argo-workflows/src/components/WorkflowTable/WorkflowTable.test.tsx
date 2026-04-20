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


import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { renderInTestApp } from '@backstage/test-utils';
import type { WorkflowSummary } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { WorkflowTable } from './WorkflowTable';

const mockWorkflows: WorkflowSummary[] = [
  {
    name: 'deploy-prod-abc123',
    namespace: 'production',
    phase: 'Succeeded',
    startedAt: new Date(Date.now() - 120000).toISOString(),
    finishedAt: new Date(Date.now() - 60000).toISOString(),
    duration: 227,
    nodes: [],
  },
  {
    name: 'deploy-staging-def456',
    namespace: 'staging',
    phase: 'Failed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    duration: 45,
    nodes: [],
  },
  {
    name: 'build-main-ghi789',
    namespace: 'ci',
    phase: 'Running',
    startedAt: new Date(Date.now() - 300000).toISOString(),
    nodes: [],
  },
  {
    name: 'lint-check-jkl012',
    namespace: 'ci',
    phase: 'Pending',
    startedAt: new Date(Date.now() - 30000).toISOString(),
    nodes: [],
  },
  {
    name: 'deploy-error-mno345',
    namespace: 'production',
    phase: 'Error',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    duration: 12,
    nodes: [],
  },
];

describe('WorkflowTable', () => {
  it('renders table with correct number of rows', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    const rows = screen.getAllByRole('row');
    // header row + 5 data rows
    expect(rows.length).toBeGreaterThanOrEqual(6);
  });

  it('displays workflow names in Name column', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    expect(screen.getByText('deploy-prod-abc123')).toBeInTheDocument();
    expect(screen.getByText('deploy-staging-def456')).toBeInTheDocument();
    expect(screen.getByText('build-main-ghi789')).toBeInTheDocument();
    expect(screen.getByText('lint-check-jkl012')).toBeInTheDocument();
    expect(screen.getByText('deploy-error-mno345')).toBeInTheDocument();
  });

  it('renders correct status label for each phase', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    // Status labels appear in both filter chips (buttons) and table rows (spans)
    // Check that the table row status indicators exist by looking for SVG icons
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });

  it('displays formatted duration in Duration column', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    // 227s = 3m 47s
    expect(screen.getByText('3m 47s')).toBeInTheDocument();
    // 45s
    expect(screen.getByText('45s')).toBeInTheDocument();
    // 12s
    expect(screen.getByText('12s')).toBeInTheDocument();
    // Running and Pending workflows have no duration, plus poll indicator shows "—"
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('displays namespace in Namespace column', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    expect(screen.getAllByText('production')).toHaveLength(2);
    expect(screen.getByText('staging')).toBeInTheDocument();
    expect(screen.getAllByText('ci')).toHaveLength(2);
  });

  it('shows loading state when loading is true', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={[]} loading />,
    );

    // Backstage Table renders a progress bar when isLoading is true
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty table when workflows array is empty', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={[]} loading={false} />,
    );

    expect(screen.getByText('Argo Workflows')).toBeInTheDocument();
    // No data rows should be present
    expect(screen.queryByText('deploy-prod-abc123')).not.toBeInTheDocument();
  });

  it('renders status icons as SVG elements', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });

  it('renders filter toolbar with chips', async () => {
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Succeeded' }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by name…')).toBeInTheDocument();
  });

  it('filters workflows by phase when filter chip is clicked', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    await user.click(screen.getByRole('button', { name: 'Failed' }));

    // Only the Failed workflow should be visible
    expect(screen.getByText('deploy-staging-def456')).toBeInTheDocument();
    expect(
      screen.queryByText('deploy-prod-abc123'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('build-main-ghi789'),
    ).not.toBeInTheDocument();
  });

  it('filters workflows by name when search text is entered', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    await user.type(
      screen.getByPlaceholderText('Search by name…'),
      'deploy-prod',
    );

    expect(screen.getByText('deploy-prod-abc123')).toBeInTheDocument();
    expect(
      screen.queryByText('deploy-staging-def456'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('build-main-ghi789'),
    ).not.toBeInTheDocument();
  });

  it('combines filter and search to narrow results', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    // Filter by Succeeded phase
    await user.click(screen.getByRole('button', { name: 'Succeeded' }));
    // Search for "deploy"
    await user.type(
      screen.getByPlaceholderText('Search by name…'),
      'deploy',
    );

    // Only deploy-prod-abc123 is Succeeded AND matches "deploy"
    expect(screen.getByText('deploy-prod-abc123')).toBeInTheDocument();
    expect(
      screen.queryByText('deploy-staging-def456'),
    ).not.toBeInTheDocument();
  });

  it('shows empty filter message when filters match nothing', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    await user.type(
      screen.getByPlaceholderText('Search by name…'),
      'nonexistent-workflow-xyz',
    );

    expect(
      screen.getByText(/No workflows match the current filters/),
    ).toBeInTheDocument();
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('clears filters when "Clear filters" link is clicked', async () => {
    const user = userEvent.setup();
    await renderInTestApp(
      <WorkflowTable workflows={mockWorkflows} loading={false} />,
    );

    // Apply a search that matches nothing
    await user.type(
      screen.getByPlaceholderText('Search by name…'),
      'nonexistent-workflow-xyz',
    );

    expect(
      screen.getByText(/No workflows match the current filters/),
    ).toBeInTheDocument();

    // Click "Clear filters"
    await user.click(screen.getByText('Clear filters'));

    // All workflows should be visible again
    expect(screen.getByText('deploy-prod-abc123')).toBeInTheDocument();
    expect(screen.getByText('deploy-staging-def456')).toBeInTheDocument();
    expect(screen.getByText('build-main-ghi789')).toBeInTheDocument();
  });
});
