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

import { useState } from 'react';
import { EmptyState } from '@backstage/core-components';
import {
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
} from '@material-ui/core';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import { AWSComponent } from '@alithya-oss/backstage-plugin-aws-apps-common';

const EnvironmentSelector = ({
  input: { awsComponent },
}: {
  input: { awsComponent: AWSComponent };
}) => {
  const [selectedEnv, setSelectedEnv] = useState(
    `${awsComponent.currentEnvironment.environment.name}|${awsComponent.currentEnvironment.providerData.name}`,
  );

  const selectorItems = Object.keys(awsComponent.environments).map(env => {
    // Note that the environments' keys have been lower-cased so we get the
    // case-sensitive environment name here
    const envName = awsComponent.environments[env].environment.name;

    const key = `${envName}|${awsComponent.environments[env].providerData.name}`;
    // if (awsComponent.environments[env].providerData.length>1) TODO: Pretty name for single provider environments

    return (
      <MenuItem key={`ID-${key}`} value={key}>
        {envName}
      </MenuItem>
    );
  });

  const handleChange = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => {
    const [envName, providerName] = (event.target.value as string).split('|');
    awsComponent.setCurrentProvider(envName, providerName);
    setSelectedEnv(`${envName}|${providerName}`);
  };

  return (
    <div>
      <FormControl style={{ margin: 8, minWidth: 120 }}>
        <InputLabel id="lbl-select-aws-environment">Environments</InputLabel>
        <Select
          labelId="select-aws-environment"
          id="select-aws-environment"
          value={selectedEnv}
          label="Environments"
          onChange={handleChange}
        >
          {selectorItems}
        </Select>
      </FormControl>
    </div>
  );
};

// Extract information from hook and populate the drop-down
export const EnvironmentSelectorWidget = () => {
  const awsAppLoadingStatus = useAsyncAwsApp();

  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    const input = {
      awsComponent: awsAppLoadingStatus.component,
    };
    return <EnvironmentSelector input={input} />;
  }
  return (
    <EmptyState
      missing="data"
      title="No environment data to show"
      description="Environments data would show here"
    />
  );
};
