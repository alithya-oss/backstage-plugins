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
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import type { WorkflowPhase } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { WorkflowFilters } from './WorkflowFilters';

describe('WorkflowFilters', () => {
  const defaultProps = {
    phases: [] as WorkflowPhase[],
    onPhasesChange: jest.fn(),
    searchText: '',
    onSearchChange: jest.fn(),
    lastUpdated: null as Date | null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter chips', () => {
    render(<WorkflowFilters {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Succeeded' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Running' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Error' })).toBeInTheDocument();
  });

  it('marks "All" chip as pressed when no phases are active', () => {
    render(<WorkflowFilters {...defaultProps} phases={[]} />);

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Succeeded' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onPhasesChange with phase added when clicking inactive chip', async () => {
    const user = userEvent.setup();
    const onPhasesChange = jest.fn();
    render(
      <WorkflowFilters
        {...defaultProps}
        phases={[]}
        onPhasesChange={onPhasesChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Succeeded' }));

    expect(onPhasesChange).toHaveBeenCalledWith(['Succeeded']);
  });

  it('calls onPhasesChange with phase removed when clicking active chip', async () => {
    const user = userEvent.setup();
    const onPhasesChange = jest.fn();
    render(
      <WorkflowFilters
        {...defaultProps}
        phases={['Succeeded', 'Failed']}
        onPhasesChange={onPhasesChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Succeeded' }));

    expect(onPhasesChange).toHaveBeenCalledWith(['Failed']);
  });

  it('calls onPhasesChange with empty array when clicking "All"', async () => {
    const user = userEvent.setup();
    const onPhasesChange = jest.fn();
    render(
      <WorkflowFilters
        {...defaultProps}
        phases={['Succeeded']}
        onPhasesChange={onPhasesChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(onPhasesChange).toHaveBeenCalledWith([]);
  });

  it('calls onSearchChange when typing in search input', async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();
    render(
      <WorkflowFilters {...defaultProps} onSearchChange={onSearchChange} />,
    );

    await user.type(screen.getByPlaceholderText('Search by name…'), 'd');

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('d');
  });

  it('shows poll indicator with time when lastUpdated is provided', () => {
    const now = new Date();
    render(<WorkflowFilters {...defaultProps} lastUpdated={now} />);

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('shows "—" in poll indicator when lastUpdated is null', () => {
    render(<WorkflowFilters {...defaultProps} lastUpdated={null} />);

    expect(screen.getByText(/Updated —/)).toBeInTheDocument();
  });

  it('shows "—" in poll indicator when lastUpdated is invalid Date', () => {
    render(
      <WorkflowFilters {...defaultProps} lastUpdated={new Date('invalid')} />,
    );

    expect(screen.getByText(/Updated —/)).toBeInTheDocument();
  });

  it('marks active phase chips as pressed', () => {
    render(
      <WorkflowFilters {...defaultProps} phases={['Running', 'Failed']} />,
    );

    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Running' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Failed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Succeeded' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
