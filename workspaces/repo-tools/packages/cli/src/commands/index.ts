/*
 * Copyright 2025 The Alithya Authors
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

import { Command } from 'commander';
import { exitWithError } from '../lib/errors';
import { assertError } from '@backstage/errors';

type ActionFunc = (...args: any[]) => Promise<void>;
type ActionExports<TModule extends object> = {
  [KName in keyof TModule as TModule[KName] extends ActionFunc
    ? KName
    : never]: TModule[KName];
};

// Wraps an action function so that it always exits and handles errors
export function lazy<TModule extends object>(
  moduleLoader: () => Promise<TModule>,
  exportName: keyof ActionExports<TModule>,
): (...args: any[]) => Promise<never> {
  return async (...args: any[]) => {
    try {
      const mod = await moduleLoader();
      const actualModule = (
        mod as unknown as { default: ActionExports<TModule> }
      ).default;
      const actionFunc = actualModule[exportName] as ActionFunc;
      await actionFunc(...args);

      process.exit(0);
    } catch (error) {
      assertError(error);
      exitWithError(error);
    }
  };
}

export const registerCommands = (program: Command) => {
  program
    .command('plugin')
    .command('migrate')
    .requiredOption('--monorepo-path [path]', 'Path to the monorepo')
    .requiredOption(
      '--workspace-name [name]',
      'Name of the workspace that will be created, the plugins will be pulled automatically from the monorepo',
    )
    .option('--branch [branch]', 'use a branch for deprecation commits')
    .option('--force', 'Overwrite existing workspace', false)
    .action(lazy(() => import('./plugin/migrate'), 'default'));

  program
    .command('workspace')
    .command('create')
    .action(lazy(() => import('./workspace/create'), 'default'));

  const lintCommand = program
    .command('lint [command]')
    .description('Tools for linting repository.');
  lintCommand
    .command('legacy-backend-exports [workspace-path...]')
    .description(
      'Lint backend plugin packages for legacy exports and make sure it conforms to the new export pattern',
    )
    .action(lazy(() => import('./lint/lint-legacy-backend-exports'), 'lint'));
};
