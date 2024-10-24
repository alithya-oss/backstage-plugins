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
import React, { useEffect, useState } from 'react';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import CircularProgress from '@material-ui/core/CircularProgress';
import {
  Table,
  Paper,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@material-ui/core';
import {
  GetAllTemplateNamesResponse,
  isTimeSaverApiError,
} from '@alithya-oss/plugin-time-saver-common';

export function EmptyTimeSaver(): React.ReactElement {
  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const [data, setData] = useState<GetAllTemplateNamesResponse | null>(null);

  useEffect(() => {
    const url = `${configApi.getString(
      'backend.baseUrl',
    )}/api/time-saver/templates`;

    fetchApi
      .fetch(url)
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

  const cellStyle: React.CSSProperties = {
    color: 'red',
    fontWeight: 'bold',
    fontSize: '20px',
  };

  return data && data.templates.length === 0 ? (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell style={cellStyle}>
              Please fill your templates with data, they will be displayed after
              their executions
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <></>
  );
}
