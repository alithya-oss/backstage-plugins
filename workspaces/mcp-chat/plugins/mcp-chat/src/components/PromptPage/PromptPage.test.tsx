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

import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { PromptPage } from './PromptPage';

jest.mock('@backstage/core-components', () => ({
  Content: ({ children }: { children: ReactNode }) => (
    <div data-testid="content">{children}</div>
  ),
  Page: ({ children, themeId }: { children: ReactNode; themeId: string }) => (
    <div data-testid="page" data-theme-id={themeId}>
      {children}
    </div>
  ),
}));

// The content owns the Assistant UI runtime and the plugin API; the shell is the
// only thing under test here, so it is replaced by a marker.
jest.mock('./PromptPageContent', () => ({
  PromptPageContent: () => <div data-testid="prompt-page-content" />,
}));

describe('PromptPage', () => {
  it('renders the prompt page content inside the tool page shell', () => {
    render(<PromptPage />);

    const page = screen.getByTestId('page');
    const content = screen.getByTestId('content');

    expect(page).toHaveAttribute('data-theme-id', 'tool');
    expect(page).toContainElement(content);
    expect(content).toContainElement(screen.getByTestId('prompt-page-content'));
  });
});
