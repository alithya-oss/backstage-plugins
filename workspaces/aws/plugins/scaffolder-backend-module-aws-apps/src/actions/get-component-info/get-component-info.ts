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
import { kebabCase } from 'lodash';
import { stringify } from 'yaml';

const ID = 'aws-apps:get-component-info';

const examples = [
  {
    description: 'Sets useful component info for other actions to use',
    example: stringify({
      steps: [
        {
          action: ID,
          id: 'getComponentInfo',
          name: 'Get Component Info',
          input: {
            componentName: 'myComponent',
          },
        },
      ],
    }),
  },
];

/**
 * Creates a scaffolder action that derives useful component metadata
 * such as a kebab-case name for use by subsequent template steps.
 *
 * @public
 */
export function getComponentInfoAction() {
  return createTemplateAction({
    id: ID,
    description: 'Sets useful component info for other actions to use',
    supportsDryRun: true,
    examples,
    schema: {
      input: {
        componentName: z => z.string().describe('The name of the component'),
      },
      output: {
        kebabCaseComponentName: z =>
          z.string().describe('The component name, converted to kebab case'),
      },
    },
    handler: async ctx => {
      // Note: no special handling is needed for dry runs

      const { componentName } = ctx.input;

      const kebabComponentName = kebabCase(componentName);

      ctx.logger.info(`Kebab case component name: ${kebabComponentName}`);
      ctx.output('kebabCaseComponentName', kebabComponentName);
    },
  });
}
