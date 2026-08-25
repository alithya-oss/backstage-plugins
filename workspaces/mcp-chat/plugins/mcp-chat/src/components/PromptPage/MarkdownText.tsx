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

import ReactMarkdown from 'react-markdown';
import type { TextMessagePartComponent } from '@assistant-ui/react';
import styles from './MarkdownText.module.css';

/**
 * Renders a `text` message part as markdown.
 *
 * The same component renders a growing text part and a finished one: the text a
 * part holds at any moment is parsed as markdown, so formatting appears as soon
 * as the fragments that complete a construct have arrived rather than only at
 * the end of the run. A provider that delivers its whole reply in one fragment
 * therefore takes exactly this path too — there is no separate code path for
 * non-streaming providers.
 *
 * `data-status` carries the part's own status so styling can mark text that is
 * still arriving without a second component.
 */
export const MarkdownText: TextMessagePartComponent = ({ text, status }) => (
  <div className={styles.markdown} data-status={status.type}>
    <ReactMarkdown>{text}</ReactMarkdown>
  </div>
);
