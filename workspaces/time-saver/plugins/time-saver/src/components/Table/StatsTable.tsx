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
import React, { useState, useEffect } from 'react';

import CircularProgress from '@material-ui/core/CircularProgress';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { DataGrid, GridColDef, GridSortModel } from '@mui/x-data-grid';
import { useTheme, Paper } from '@material-ui/core';
import {
  GetAllStatsResponse,
  TimeSaverApiErrorResponse,
  isTimeSaverApiError,
} from '@alithya-oss/plugin-time-saver-common';

type Stat = {
  id: string;
  team: string;
  timeSaved: number;
  templateName: string;
  [key: string]: string | number;
};

interface StatsTableProps {
  team?: string;
  template_name?: string;
}

const StatsTable: React.FC<StatsTableProps> = ({ team, template_name }) => {
  const [data, setData] = useState<Stat[] | TimeSaverApiErrorResponse | null>(
    null,
  );
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'timeSaved', sort: 'asc' },
  ]);

  const configApi = useApi(configApiRef);
  const fetchApi = useApi(fetchApiRef);

  const theme = useTheme();

  useEffect(() => {
    let url = `${configApi.getString(
      'backend.baseUrl',
    )}/api/time-saver/getStats`;
    if (team) {
      url = `${url}?team=${team}`;
    } else if (template_name) {
      url = `${url}?templateName=${template_name}`;
    }

    fetchApi
      .fetch(url)
      .then(response => response.json())
      .then((dt: GetAllStatsResponse | TimeSaverApiErrorResponse) => {
        const statsWithIds = !isTimeSaverApiError(dt)
          ? dt.stats.map((stat, index) => ({
              ...stat,
              id: index.toString(),
            }))
          : dt;
        setData(statsWithIds);
        setSortModel([{ field: 'timeSaved', sort: 'desc' }]);
      })
      .catch();
  }, [configApi, team, template_name, fetchApi]);

  if (!data) {
    return <CircularProgress />;
  }

  if (isTimeSaverApiError(data)) {
    return <>{data.errorMessage}</>;
  }

  const columns: GridColDef[] = [
    {
      field: 'team',
      headerName: 'Team',
      flex: 1,
      sortable: true,
    },
    {
      field: 'templateName',
      headerName: 'Template Name',
      flex: 1,
      sortable: true,
    },
    { field: 'timeSaved', headerName: 'Sum', flex: 1, sortable: true },
  ].filter(col => data.some(row => !!row[col.field]));

  return (
    <Paper
      style={{
        height: 400,
        width: '100%',
        margin: '16px',
        padding: '16px',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <DataGrid
        rows={data}
        columns={columns}
        sortModel={sortModel}
        onSortModelChange={model => setSortModel(model)}
        // className="test" :: TODO : Check CSS correlation
        sx={{
          color: theme.palette.text.primary,
          '& .MuiDataGrid-cell:hover': { color: theme.palette.text.secondary },
          '& .MuiDataGrid-footerContainer': {
            color: theme.palette.text.primary,
          },
          '& .v5-MuiToolbar-root': {
            color: theme.palette.text.primary,
          },
          '& .v5-MuiTablePagination-actions button': {
            color: theme.palette.text.primary,
          },
        }}
      />
    </Paper>
  );
};

export default StatsTable;
