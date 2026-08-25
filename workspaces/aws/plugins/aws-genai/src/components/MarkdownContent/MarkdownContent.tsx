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
import remarkGfm from 'remark-gfm';
import styles from './MarkdownContent.module.css';

/**
 * Props for {@link MarkdownContent}.
 */
export interface MarkdownContentProps {
  /** GitHub flavored markdown to render. */
  content: string;
  className?: string;
}

/**
 * Renders GitHub flavored markdown styled with Backstage UI design tokens.
 *
 * This is the plugin-local replacement for the markdown renderer that used to
 * come from the legacy Backstage core component library, which this plugin no
 * longer depends on.
 */
export const MarkdownContent = ({
  content,
  className,
}: MarkdownContentProps) => (
  <div
    className={className ? `${styles.markdown} ${className}` : styles.markdown}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);
