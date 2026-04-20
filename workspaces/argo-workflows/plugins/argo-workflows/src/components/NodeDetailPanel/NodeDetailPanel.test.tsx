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
import { NodeDetailPanel } from './NodeDetailPanel';

// Mock the translation hook to return the key as the translated string
jest.mock('@backstage/core-plugin-api/alpha', () => ({
  ...jest.requireActual('@backstage/core-plugin-api/alpha'),
  useTranslationRef: () => ({
    t: (key: string, params?: Record<string, string>) => {
      // Return the last segment of the key as a readable label
      const parts = key.split('.');
      const label = parts[parts.length - 1];
      // Capitalize first letter for display
      const readable = label.charAt(0).toUpperCase() + label.slice(1);
      if (params) {
        return Object.entries(params).reduce(
          (s, [k, v]) => s.replace(`{{${k}}}`, v),
          readable,
        );
      }
      return readable;
    },
  }),
}));

function makeNode(overrides?: Partial<NodeStatus>): NodeStatus {
  return {
    id: 'node-1',
    displayName: 'build',
    type: 'Pod',
    phase: 'Succeeded',
    startedAt: '2026-04-18T10:00:00Z',
    finishedAt: '2026-04-18T10:02:00Z',
    duration: 120,
    templateName: 'build-template',
    ...overrides,
  };
}

describe('NodeDetailPanel', () => {
  it('renders node displayName in header', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    expect(screen.getByText('build')).toBeInTheDocument();
  });

  it('renders status icon for the node phase', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Succeeded' })}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders close button with aria-label', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    const btn = screen.getByLabelText('CloseLabel');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('×');
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<NodeDetailPanel node={makeNode()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('panel-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders metadata grid with all fields', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    expect(screen.getByText('Phase')).toBeInTheDocument();
    expect(screen.getByText('Succeeded')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Pod')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('build-template')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('2026-04-18T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('2026-04-18T10:02:00Z')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  it('renders error message box for Failed node with message', () => {
    render(
      <NodeDetailPanel
        node={makeNode({
          phase: 'Failed',
          message: 'OOMKilled: container exceeded memory limit',
        })}
        onClose={jest.fn()}
      />,
    );
    const errorBox = screen.getByTestId('panel-error-message');
    expect(errorBox).toBeInTheDocument();
    expect(errorBox).toHaveTextContent('OOMKilled');
  });

  it('renders error message box for Error node with message', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Error', message: 'timeout' })}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByTestId('panel-error-message')).toHaveTextContent(
      'timeout',
    );
  });

  it('does not render error message box for Succeeded node', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Succeeded' })}
        onClose={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('panel-error-message')).not.toBeInTheDocument();
  });

  it('does not render error message box for Failed node without message', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Failed', message: undefined })}
        onClose={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('panel-error-message')).not.toBeInTheDocument();
  });

  it('renders dash for missing optional fields', () => {
    render(
      <NodeDetailPanel
        node={makeNode({
          templateName: undefined,
          finishedAt: undefined,
        })}
        onClose={jest.fn()}
      />,
    );
    // Two dashes: one for Template, one for Finished
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('applies phase-colored left border class for Succeeded', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel.className).toContain('borderSuccess');
  });

  it('applies phase-colored left border class for Failed', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Failed' })}
        onClose={jest.fn()}
      />,
    );
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel.className).toContain('borderDanger');
  });

  it('applies phase-colored left border class for Running', () => {
    render(
      <NodeDetailPanel
        node={makeNode({ phase: 'Running' })}
        onClose={jest.fn()}
      />,
    );
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel.className).toContain('borderInfo');
  });

  it('has role="complementary"', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel).toHaveAttribute('role', 'complementary');
  });

  it('has aria-label with node displayName', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel).toHaveAttribute('aria-label', 'Node detail for build');
  });

  it('has aria-live="polite"', () => {
    render(<NodeDetailPanel node={makeNode()} onClose={jest.fn()} />);
    const panel = screen.getByTestId('node-detail-panel');
    expect(panel).toHaveAttribute('aria-live', 'polite');
  });
});
