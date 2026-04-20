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
import { DAGNodeCard } from './DAGNodeCard';

function makeNode(overrides?: Partial<NodeStatus>): NodeStatus {
  return {
    id: 'node-1',
    displayName: 'build',
    type: 'Pod',
    phase: 'Succeeded',
    duration: 120,
    ...overrides,
  };
}

describe('DAGNodeCard', () => {
  it('renders displayName and duration', () => {
    render(<DAGNodeCard node={makeNode()} />);
    expect(screen.getByText('build')).toBeInTheDocument();
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  it('renders status icon for Succeeded phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Succeeded' })} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders status icon for Failed phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Failed' })} />);
    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('renders status icon for Error phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Error' })} />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders status icon for Running phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Running' })} />);
    expect(screen.getByText('◌')).toBeInTheDocument();
  });

  it('renders status icon for Pending phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Pending' })} />);
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('renders status icon for Skipped phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Skipped' })} />);
    expect(screen.getByText('⊘')).toBeInTheDocument();
  });

  it('renders status icon for Omitted phase', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Omitted' })} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applies phase-colored border class for Succeeded', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Succeeded' })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).toContain('borderSucceeded');
  });

  it('applies phase-colored border class for Failed', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Failed' })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).toContain('borderFailed');
  });

  it('applies dimmed style for Skipped', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Skipped' })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).toContain('dimmed');
  });

  it('applies dimmed style for Omitted', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Omitted' })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).toContain('dimmed');
  });

  it('does not apply dimmed style for Succeeded', () => {
    render(<DAGNodeCard node={makeNode({ phase: 'Succeeded' })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).not.toContain('dimmed');
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<DAGNodeCard node={makeNode()} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('dag-node-node-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows full displayName in title attribute for truncation', () => {
    const longName = 'very-long-workflow-node-name-that-should-truncate';
    render(<DAGNodeCard node={makeNode({ displayName: longName })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card).toHaveAttribute('title', `${longName} — Succeeded`);
  });

  it('applies selected style when isSelected is true', () => {
    render(<DAGNodeCard node={makeNode()} isSelected />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).toContain('selected');
  });

  it('does not apply selected style when isSelected is false', () => {
    render(<DAGNodeCard node={makeNode()} isSelected={false} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card.className).not.toContain('selected');
  });

  it('has aria-label with displayName, phase, and duration', () => {
    render(<DAGNodeCard node={makeNode({ duration: 120 })} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card).toHaveAttribute('aria-label', 'build, Succeeded, 2m 0s');
  });

  it('has aria-pressed="false" when not selected', () => {
    render(<DAGNodeCard node={makeNode()} isSelected={false} />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });

  it('has aria-pressed="true" when selected', () => {
    render(<DAGNodeCard node={makeNode()} isSelected />);
    const card = screen.getByTestId('dag-node-node-1');
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onClick on Enter key', () => {
    const onClick = jest.fn();
    render(<DAGNodeCard node={makeNode()} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('dag-node-node-1'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick on Space key', () => {
    const onClick = jest.fn();
    render(<DAGNodeCard node={makeNode()} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('dag-node-node-1'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick on other keys', () => {
    const onClick = jest.fn();
    render(<DAGNodeCard node={makeNode()} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('dag-node-node-1'), { key: 'Tab' });
    expect(onClick).not.toHaveBeenCalled();
  });
});
