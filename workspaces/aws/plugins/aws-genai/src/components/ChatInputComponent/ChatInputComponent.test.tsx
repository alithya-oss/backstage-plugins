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
import { ChatInputComponent } from './ChatInputComponent';

describe('ChatInputComponent', () => {
  it('should send on Enter, keep a newline on Shift+Enter and clear the field', async () => {
    const onMessage = jest.fn();
    const onClear = jest.fn();

    render(<ChatInputComponent onMessage={onMessage} onClear={onClear} />);

    const input = screen.getByLabelText('Type a message');

    await userEvent.type(input, 'first line{Shift>}{Enter}{/Shift}second line');
    expect(onMessage).not.toHaveBeenCalled();
    expect(input).toHaveValue('first line\nsecond line');

    await userEvent.type(input, '{Enter}');
    expect(onMessage).toHaveBeenCalledWith('first line\nsecond line');
    expect(input).toHaveValue('');

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should disable sending while empty and swap the send button for cancel while streaming', async () => {
    const onCancel = jest.fn();
    const onMessage = jest.fn();

    const { rerender } = render(<ChatInputComponent onMessage={onMessage} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    rerender(
      <ChatInputComponent onMessage={onMessage} disabled onCancel={onCancel} />,
    );

    expect(
      screen.queryByRole('button', { name: 'Send' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Type a message')).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
