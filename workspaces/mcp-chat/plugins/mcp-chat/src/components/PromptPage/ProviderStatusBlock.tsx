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

import { Text } from '@backstage/ui';
import { RiCloudLine } from '@remixicon/react';
import type { ProviderStatusData } from '../../types';
import styles from './ProviderStatusBlock.module.css';

/**
 * Props of {@link ProviderStatusBlock}.
 */
export interface ProviderStatusBlockProps {
  /** The reported status, or `null` while none has been read. */
  providerStatusData: ProviderStatusData | null;
  /** Whether the status is being fetched. */
  isLoading: boolean;
  /** The failure of the last fetch, if any. */
  error?: Error | undefined;
}

/**
 * Describes how the active provider delivers a reply.
 *
 * The distinction is worth showing: every provider answers through the streaming
 * endpoint, but one without native streaming reaches it through the base class's
 * fallback and delivers the whole reply as a single fragment. Without this line
 * a reply that lands in one piece looks like a stalled stream.
 */
function streamingLabel(supportsStreaming: boolean | undefined): string {
  if (supportsStreaming === undefined) {
    return 'not reported';
  }
  return supportsStreaming ? 'incremental' : 'single response';
}

/**
 * The read-only provider status block.
 *
 * Read-only is the point: the existing chat page offers no model selector and
 * neither does this panel — the provider and its model come from configuration,
 * so the panel reports them and offers no control that would suggest otherwise.
 *
 * An unavailable status is reported in place and does not gate the composer: a
 * provider that cannot be described may still answer, and finding out is the
 * user's call.
 */
export const ProviderStatusBlock = ({
  providerStatusData,
  isLoading,
  error,
}: ProviderStatusBlockProps) => {
  const provider = providerStatusData?.providers?.[0];
  const unavailable = !provider && !isLoading;
  const connected = provider?.connection?.connected ?? false;
  const detail =
    provider?.connection?.error ??
    providerStatusData?.summary?.error ??
    error?.message;

  return (
    <section className={styles.root} aria-labelledby="provider-status-heading">
      <h2 className={styles.heading} id="provider-status-heading">
        <RiCloudLine aria-hidden className={styles.headingIcon} />
        Provider
      </h2>

      {isLoading && !provider ? (
        <Text variant="body-small" color="secondary">
          Checking the provider…
        </Text>
      ) : null}

      {unavailable ? (
        <div className={styles.notice}>
          <Text variant="body-small">Provider status is unavailable.</Text>
          {detail ? (
            <Text variant="body-x-small" color="secondary">
              {detail}
            </Text>
          ) : null}
        </div>
      ) : null}

      {provider ? (
        <dl className={styles.facts}>
          <dt className={styles.term}>
            <Text variant="body-small" color="secondary">
              Connection
            </Text>
          </dt>
          <dd className={styles.value}>
            <Text
              variant="body-small"
              color={connected ? 'success' : 'danger'}
              weight="bold"
            >
              {connected ? 'Connected' : 'Not connected'}
            </Text>
          </dd>

          <dt className={styles.term}>
            <Text variant="body-small" color="secondary">
              Model
            </Text>
          </dt>
          <dd className={styles.value}>
            <Text variant="body-small">{provider.model || 'not reported'}</Text>
          </dd>

          <dt className={styles.term}>
            <Text variant="body-small" color="secondary">
              Streaming
            </Text>
          </dt>
          <dd className={styles.value}>
            <Text variant="body-small">
              {streamingLabel(provider.supportsStreaming)}
            </Text>
          </dd>

          {!connected && detail ? (
            <>
              <dt className={styles.term}>
                <Text variant="body-small" color="secondary">
                  Detail
                </Text>
              </dt>
              <dd className={styles.value}>
                <Text variant="body-x-small" color="secondary">
                  {detail}
                </Text>
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
};
