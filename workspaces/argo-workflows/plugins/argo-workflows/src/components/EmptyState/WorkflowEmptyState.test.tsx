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
import '@testing-library/jest-dom';
import { ArgoWorkflowsError } from '../../api';
import { WorkflowEmptyState } from './WorkflowEmptyState';

describe('WorkflowEmptyState', () => {
  it('renders info alert when no workflows found', () => {
    render(<WorkflowEmptyState workflowCount={0} namespace="production" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/No Argo Workflows found/)).toBeInTheDocument();
  });

  it('includes namespace in empty state message', () => {
    render(<WorkflowEmptyState workflowCount={0} namespace="production" />);

    expect(
      screen.getByText(/No Argo Workflows found in namespace production/),
    ).toBeInTheDocument();
  });

  it('includes label selector in empty state message when provided', () => {
    render(
      <WorkflowEmptyState
        workflowCount={0}
        namespace="production"
        labelSelector="app=my-service"
      />,
    );

    expect(
      screen.getByText(/matching label selector app=my-service/),
    ).toBeInTheDocument();
  });

  it('renders warning alert for missing annotation error', () => {
    const error = new Error(
      'Missing backstage.io/kubernetes-namespace annotation on entity test-service',
    );

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Missing Configuration')).toBeInTheDocument();
  });

  it('warning alert mentions backstage.io/kubernetes-namespace', () => {
    const error = new Error(
      'Missing backstage.io/kubernetes-namespace annotation on entity test-service',
    );

    render(<WorkflowEmptyState error={error} />);

    expect(
      screen.getByText(/backstage.io\/kubernetes-namespace/),
    ).toBeInTheDocument();
  });

  it('renders danger alert for 403 error', () => {
    const error = new ArgoWorkflowsError('Forbidden', 'FORBIDDEN', 403);

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('403 alert mentions RBAC permissions', () => {
    const error = new ArgoWorkflowsError('Forbidden', 'FORBIDDEN', 403);

    render(<WorkflowEmptyState error={error} />);

    expect(
      screen.getByText(/get and list permissions on workflows.argoproj.io/),
    ).toBeInTheDocument();
  });

  it('renders danger alert for 502 error', () => {
    const error = new ArgoWorkflowsError('Bad Gateway', 'BAD_GATEWAY', 502);

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Cluster Unreachable')).toBeInTheDocument();
  });

  it('renders danger alert for 504 error', () => {
    const error = new ArgoWorkflowsError(
      'Gateway Timeout',
      'GATEWAY_TIMEOUT',
      504,
    );

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Cluster Unreachable')).toBeInTheDocument();
  });

  it('502/504 alert mentions Kubernetes cluster connectivity', () => {
    const error = new ArgoWorkflowsError('Bad Gateway', 'BAD_GATEWAY', 502);

    render(<WorkflowEmptyState error={error} />);

    expect(
      screen.getByText(/Unable to connect to the Kubernetes cluster/),
    ).toBeInTheDocument();
  });

  it('renders generic danger alert for unknown errors', () => {
    const error = new Error('Something unexpected happened');

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(
      screen.getByText('Something unexpected happened'),
    ).toBeInTheDocument();
  });

  it('returns null when no error and workflowCount > 0', () => {
    const { container } = render(
      <WorkflowEmptyState workflowCount={5} namespace="production" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('handles error with empty message', () => {
    const error = new Error('');

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred.')).toBeInTheDocument();
  });

  it('handles error with undefined message', () => {
    const error = new Error();
    error.message = undefined as unknown as string;

    render(<WorkflowEmptyState error={error} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('An unknown error occurred.')).toBeInTheDocument();
  });
});
