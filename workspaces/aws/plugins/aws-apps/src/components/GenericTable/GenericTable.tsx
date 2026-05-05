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

import { useEffect, useState } from 'react';
import { TableColumn, Table } from '@backstage/core-components';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  container: {
    width: 850,
  },
  empty: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
}));

interface GenericTableProps {
  object: Record<string, string>;
  title: string;
}

export const GenericTable = ({ object, title }: GenericTableProps) => {
  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
    },
    { title: 'Value', field: 'value' },
  ];
  const [data, updateData] = useState<Array<{}>>([]);
  const classes = useStyles();
  useEffect(() => {
    // console.log(object)
    if (object) {
      updateData(
        Object.entries(object).map(([key, value]) => ({
          name: key,
          value,
        })),
      );
    }
  }, [object]);

  return (
    <Table
      title={title}
      columns={columns}
      data={data}
      options={{ padding: 'dense' }}
      emptyContent={<div className={classes.empty}>No data,&nbsp;</div>}
    />
  );
};
