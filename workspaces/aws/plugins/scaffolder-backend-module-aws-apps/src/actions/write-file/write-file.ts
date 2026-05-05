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

// SPDX-License-Identifier: Apache-2.0

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { resolveSafeChildPath } from '@backstage/backend-plugin-api';
import fs from 'fs-extra';
import yaml from 'yaml';

const ID = 'aws-apps:fs:write';

const examples = [
  {
    description: 'Write to a file',
    example: yaml.stringify({
      steps: [
        {
          action: ID,
          id: 'writeToFile',
          name: 'Write to File',
          input: {
            path: './myFile.txt',
            content: 'hello world!',
          },
        },
      ],
    }),
  },
];

/**
 * Creates a scaffolder action that writes content to a file in the workspace.
 *
 * @public
 */
export function createWriteFileAction() {
  return createTemplateAction({
    id: ID,
    description: 'Writes supplied content to a file at the specified location',
    supportsDryRun: true,
    examples,
    schema: {
      input: {
        path: z =>
          z.string().describe('The relative path to the file to be created'),
        content: z => z.string().describe('The file contents to write'),
        formatJsonContent: z =>
          z
            .boolean()
            .default(false)
            .describe('Whether or not to prettify JSON content'),
      },
      output: {
        path: z => z.string().describe('Path of the file that was created'),
      },
    },
    handler: async ctx => {
      const destFilepath = resolveSafeChildPath(
        ctx.workspacePath,
        ctx.input.path,
      );
      let formattedContent = ctx.input.content;
      if (ctx.input.formatJsonContent) {
        try {
          const parsedContent = JSON.parse(ctx.input.content);
          formattedContent = JSON.stringify(parsedContent, null, 2);
        } catch (error: unknown) {
          // Content is not JSON, no need to format
          if (error instanceof Error) {
            ctx.logger.error(
              'Failed to format file contents. Only parsable JSON content can be used with the "formatJsonContent" flag enabled.',
              error,
            );
          } else {
            ctx.logger.warn(
              'Failed to format file contents. Only parsable JSON content can be used with the "formatJsonContent" flag enabled.',
            );
          }
        }
      }

      fs.outputFileSync(destFilepath, formattedContent);

      ctx.output('path', destFilepath);
    },
  });
}
