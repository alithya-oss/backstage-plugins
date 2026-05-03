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

import { EntitySwitch } from '@backstage/plugin-catalog';
import {
  isGithubActionsAvailable,
  EntityGithubActionsContent,
} from '@alithya-oss/backstage-plugin-github-actions';
import {
  isGitlabAvailable,
  EntityGitlabContent,
} from '@immobiliarelabs/backstage-plugin-gitlab';
import { EmptyState } from '@backstage/core-components';
import { Button } from '@material-ui/core';

export function CICDContent() {
  return (
    // This is an example of how you can implement your company's logic in entity page.
    // You can, for example, enforce that all components of type 'service' should use GitHubActions
    <EntitySwitch>
      <EntitySwitch.Case if={isGithubActionsAvailable}>
        <EntityGithubActionsContent />
      </EntitySwitch.Case>
      <EntitySwitch.Case if={isGitlabAvailable}>
        <EntityGitlabContent />
      </EntitySwitch.Case>

      <EntitySwitch.Case>
        <EmptyState
          title="No CI/CD available for this entity"
          missing="info"
          description="You need to add an annotation to your component if you want to enable CI/CD for it. You can read more about annotations in Backstage by clicking the button below."
          action={
            <Button
              variant="contained"
              color="primary"
              href="https://backstage.io/docs/features/software-catalog/well-known-annotations"
            >
              Read more
            </Button>
          }
        />
      </EntitySwitch.Case>
    </EntitySwitch>
  );
}
