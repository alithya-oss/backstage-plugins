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

import { Button, Switch, Text } from '@backstage/ui';
import { RiServerLine } from '@remixicon/react';
import type { MCPServer } from '../../types';
import styles from './McpServerToggles.module.css';

/**
 * Props of {@link McpServerToggles}.
 */
export interface McpServerTogglesProps {
  /** The configured MCP servers, carrying their view-model `enabled` flag. */
  servers: MCPServer[];
  /** Whether the server list is being fetched. */
  isLoading: boolean;
  /** The failure of the last fetch, if any. */
  error?: Error | undefined;
  /** Flips one server's enabled flag. */
  onToggle: (serverId: string) => void;
  /** Re-fetches the server list. */
  onRetry: () => void;
}

/**
 * The MCP server enable/disable list.
 *
 * Enabling is a per-server decision, not a per-tool one: the enabled ids are
 * what the page hands to the next run, so disabling a server withholds all of
 * its tools from the provider from the next prompt onwards without interrupting
 * a run already in flight.
 *
 * A failed fetch is reported here and nowhere else — the composer stays usable,
 * because a conversation without MCP tools is still a conversation.
 */
export const McpServerToggles = ({
  servers,
  isLoading,
  error,
  onToggle,
  onRetry,
}: McpServerTogglesProps) => (
  <section className={styles.root} aria-labelledby="mcp-servers-heading">
    <h2 className={styles.heading} id="mcp-servers-heading">
      <RiServerLine aria-hidden className={styles.headingIcon} />
      MCP servers
    </h2>

    {error ? (
      <div className={styles.notice} role="alert">
        <Text variant="body-small">The MCP server list is unavailable.</Text>
        <Button size="small" variant="secondary" onPress={onRetry}>
          Retry
        </Button>
      </div>
    ) : null}

    {!error && isLoading && servers.length === 0 ? (
      <Text variant="body-small" color="secondary">
        Loading MCP servers…
      </Text>
    ) : null}

    {!error && !isLoading && servers.length === 0 ? (
      <Text variant="body-small" color="secondary">
        No MCP servers are configured.
      </Text>
    ) : null}

    {servers.length > 0 ? (
      <ul className={styles.list}>
        {servers.map(server => (
          <li className={styles.item} key={server.id}>
            <Switch
              className={styles.toggle}
              label={server.name}
              isSelected={server.enabled}
              onChange={() => onToggle(server.id)}
            />
            {server.status.connected ? null : (
              <Text variant="body-x-small" color="secondary">
                unreachable
              </Text>
            )}
          </li>
        ))}
      </ul>
    ) : null}
  </section>
);
