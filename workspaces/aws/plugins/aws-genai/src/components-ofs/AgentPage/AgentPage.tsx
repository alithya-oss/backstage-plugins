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

import { FullPage, Header } from '@backstage/ui';
import { AgentPageContent } from '../../components/AgentPage';
import styles from './AgentPage.module.css';

/**
 * Props of the old frontend system agent chat page.
 *
 * @deprecated Use the new frontend system instead
 * @public
 */
export interface AgentPageProps {
  title?: string;
}

/**
 * Agent chat page for the old frontend system. Unlike the new frontend system,
 * where the framework renders the page header, this variant brings its own page
 * shell.
 *
 * @deprecated Use the new frontend system instead
 * @public
 */
export function AgentPageImpl({ title = 'Chat Assistant' }: AgentPageProps) {
  return (
    <FullPage className={styles.page}>
      <Header title={title} />
      <AgentPageContent />
    </FullPage>
  );
}
