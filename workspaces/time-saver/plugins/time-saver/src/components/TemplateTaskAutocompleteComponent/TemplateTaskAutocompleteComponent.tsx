/*
 * Copyright 2024 The Backstage Authors
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
import * as React from 'react';
//  TODO :: Fix the need to place this exception:
// eslint-disable-next-line no-restricted-imports
import { Autocomplete } from '@mui/material';
import { useEffect, useState } from 'react';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import CircularProgress from '@material-ui/core/CircularProgress';
import { TextField } from '@material-ui/core';
import {
  GetAllTemplateTasksResponse,
  isTimeSaverApiError,
} from '@alithya-oss/plugin-time-saver-common';

interface TemplateTaskChange {
  onTemplateTaskChange: (templateTask: string) => void;
}

export default function TemplateTaskAutocomplete({
  onTemplateTaskChange,
}: TemplateTaskChange) {
  const [_task, setTask] = React.useState('');

  const handleChange = (
    _event: React.ChangeEvent<NonNullable<unknown>>,
    value: string | null,
  ) => {
    const selectedTemplateTaskId = value || '';
    setTask(selectedTemplateTaskId);
    onTemplateTaskChange(selectedTemplateTaskId);
  };

  const [data, setData] = useState<GetAllTemplateTasksResponse | null>(null);
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    fetchApi
      .fetch(
        `${configApi.getString(
          'backend.baseUrl',
        )}/api/time-saver/templateTasks`,
      )
      .then(response => response.json())
      .then(dt => setData(dt))
      .catch();
  }, [configApi, fetchApi]);

  if (!data) {
    return <CircularProgress />;
  }

  if (isTimeSaverApiError(data)) {
    return <>{data.errorMessage}</>;
  }

  const templates = data.templateTasks;

  return (
    <Autocomplete
      disablePortal
      id="combo-box-demo"
      options={templates}
      style={{ width: 500 }}
      onChange={handleChange}
      renderInput={params => (
        <TextField {...params} variant="outlined" label="TemplateTaskId" />
      )}
    />
  );
}
