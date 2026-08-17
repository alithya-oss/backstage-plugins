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

import { spawn } from 'child_process';
import * as path from 'path';
import { promises as fs } from 'fs';
import { LoggerService } from '@backstage/backend-plugin-api';

/**
 * Helper function to find npx executable path.
 * Searches common installation locations and validates the executable works.
 *
 * @param logger - The logger service for diagnostic output
 * @returns Promise resolving to the path to the npx executable
 * @throws Error if npx cannot be found or is not functional
 * @public
 */
export async function findNpxPath(logger: LoggerService): Promise<string> {
  // Get the directory where node is installed
  const nodeDir = path.dirname(process.execPath);

  const possiblePaths = [
    'npx', // Try system PATH first
    path.join(nodeDir, 'npx'), // Same dir as node (Unix)
    path.join(nodeDir, 'npx.cmd'), // Windows
    '/usr/local/bin/npx', // Common installation path
    '/opt/homebrew/bin/npx', // Homebrew on Apple Silicon
  ];

  logger.debug(`Node.js executable: ${process.execPath}`);
  logger.debug(`Searching for npx in: ${possiblePaths.join(', ')}`);

  for (const npxPath of possiblePaths) {
    try {
      // Check if file exists first
      await fs.access(npxPath);

      // Test if this path works by running npx --version
      const child = spawn(npxPath, ['--version'], { stdio: 'pipe' });
      const exitCode = await new Promise(resolve => {
        child.on('close', resolve);
        child.on('error', () => resolve(1));
      });

      if (exitCode === 0) {
        logger.debug(`Found npx at: ${npxPath}`);
        return npxPath;
      }
    } catch (error) {
      // Continue to next path
      logger.debug(`npx not found at: ${npxPath}`);
    }
  }

  throw new Error(
    'npx not found. Please ensure Node.js is properly installed with npm.',
  );
}
