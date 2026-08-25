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

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button, ButtonIcon, Text } from '@backstage/ui';
import { RiDeleteBinLine, RiSendPlane2Line } from '@remixicon/react';
import styles from './ChatInputComponent.module.css';

interface ChatInputComponentProps {
  onMessage: (message: string) => void;
  disabled?: boolean;
  onClear?: () => void;
  onCancel?: () => void;
}

export const ChatInputComponent = ({
  onMessage,
  disabled,
  onClear,
  onCancel,
}: ChatInputComponentProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const labelId = useId();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const processMessage = () => {
    onMessage(message);
    setMessage('');
  };

  const checkKeyPress = (evt: KeyboardEvent<HTMLTextAreaElement>) => {
    if (evt.code === 'Enter' && !evt.shiftKey && message.trim()) {
      processMessage();
      evt.preventDefault();
    }
  };

  return (
    <div className={styles.layout}>
      <div className={styles.field}>
        <Text as="label" id={labelId} variant="body-medium" color="secondary">
          Type a message
        </Text>
        {/* BUI has no multiline text field, so the auto-growing chat input is a
            native textarea styled with BUI design tokens. */}
        <textarea
          ref={inputRef}
          className={styles.textArea}
          aria-labelledby={labelId}
          rows={1}
          value={message}
          disabled={disabled}
          onKeyDown={checkKeyPress}
          onChange={evt => setMessage(evt.target.value)}
        />
      </div>
      <div className={styles.actions}>
        {disabled && onCancel ? (
          <Button variant="secondary" destructive onPress={onCancel}>
            Cancel
          </Button>
        ) : (
          <ButtonIcon
            variant="primary"
            aria-label="Send"
            icon={<RiSendPlane2Line />}
            isDisabled={!message.trim()}
            onPress={processMessage}
          />
        )}
        <ButtonIcon
          variant="tertiary"
          aria-label="Clear"
          icon={<RiDeleteBinLine />}
          isDisabled={disabled}
          onPress={() => onClear?.()}
        />
      </div>
    </div>
  );
};
