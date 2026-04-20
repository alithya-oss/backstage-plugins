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
import type { DAGGroup } from '@alithya-oss/backstage-plugin-argo-workflows-common';
import { DAGGroupNode } from './DAGGroupNode';

jest.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}));

function makeGroup(overrides?: Partial<DAGGroup>): DAGGroup {
  return {
    id: 'dag-1',
    displayName: 'build-pipeline',
    type: 'DAG',
    childNodeIds: ['a', 'b', 'c'],
    phase: 'Succeeded',
    ...overrides,
  };
}

function renderGroupNode(group: DAGGroup, isCollapsed: boolean, onToggle = jest.fn()) {
  return render(
    <DAGGroupNode
      id={group.id}
      data={{ group, isCollapsed, onToggle } as any}
      type="dagGroup"
      {...({} as any)}
    />,
  );
}

describe('DAGGroupNode', () => {
  it('renders expanded group with name and type badge', () => {
    renderGroupNode(makeGroup(), false);
    expect(screen.getByText('build-pipeline')).toBeInTheDocument();
    expect(screen.getByText('DAG')).toBeInTheDocument();
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('renders collapsed group with name and child count', () => {
    renderGroupNode(makeGroup(), true);
    expect(screen.getByText('build-pipeline')).toBeInTheDocument();
    expect(screen.getByText('3 nodes')).toBeInTheDocument();
    expect(screen.getByText('▶')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button clicked (expanded)', () => {
    const onToggle = jest.fn();
    renderGroupNode(makeGroup(), false, onToggle);
    fireEvent.click(screen.getByTestId('dag-group-toggle-dag-1'));
    expect(onToggle).toHaveBeenCalledWith('dag-1');
  });

  it('calls onToggle when toggle button clicked (collapsed)', () => {
    const onToggle = jest.fn();
    renderGroupNode(makeGroup(), true, onToggle);
    fireEvent.click(screen.getByTestId('dag-group-toggle-dag-1'));
    expect(onToggle).toHaveBeenCalledWith('dag-1');
  });

  it('applies success border for Succeeded phase', () => {
    renderGroupNode(makeGroup({ phase: 'Succeeded' }), true);
    const el = screen.getByTestId('dag-group-dag-1');
    expect(el.className).toContain('borderSuccess');
  });

  it('applies danger border for Failed phase', () => {
    renderGroupNode(makeGroup({ phase: 'Failed' }), true);
    const el = screen.getByTestId('dag-group-dag-1');
    expect(el.className).toContain('borderDanger');
  });

  it('applies info border for Running phase', () => {
    renderGroupNode(makeGroup({ phase: 'Running' }), true);
    const el = screen.getByTestId('dag-group-dag-1');
    expect(el.className).toContain('borderInfo');
  });
});
