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
import { ErrorBoundary } from './ErrorBoundary';

function ThrowingComponent(): JSX.Element {
  throw new Error('Test rendering error');
}

function GoodComponent() {
  return <div data-testid="good-child">Hello</div>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('good-child')).toBeInTheDocument();
    expect(screen.queryByText('fallback')).not.toBeInTheDocument();
  });

  it('renders fallback when child throws', () => {
    render(
      <ErrorBoundary fallback={<span data-testid="fallback">Oops</span>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('logs error to console.error', () => {
    render(
      <ErrorBoundary fallback={<span>fallback</span>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[argo-workflows] Rendering error:',
      expect.any(Error),
      expect.any(String),
    );
  });

  it('renders DAG fallback metadata when DAG throws', () => {
    render(
      <ErrorBoundary
        fallback={
          <div data-testid="dag-fallback">
            Unable to render workflow graph. Showing metadata only.
          </div>
        }
      >
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('dag-fallback')).toBeInTheDocument();
    expect(
      screen.getByText(/Unable to render workflow graph/),
    ).toBeInTheDocument();
  });

  it('renders panel fallback when panel throws', () => {
    render(
      <ErrorBoundary
        fallback={
          <span data-testid="panel-fallback">
            Unable to display node details
          </span>
        }
      >
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('panel-fallback')).toBeInTheDocument();
  });

  it('renders page fallback when page content throws', () => {
    render(
      <ErrorBoundary
        fallback={
          <div data-testid="page-fallback">
            Something went wrong loading Argo Workflows.
          </div>
        }
      >
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('page-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });
});
