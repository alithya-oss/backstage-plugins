// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import { EmptyState, Table, TableColumn } from '@backstage/core-components';
import { LinearProgress } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { opaApiRef } from '../../api';
import Typography from '@mui/material/Typography';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import { AuditRecord } from '@alithya-oss/backstage-plugin-aws-apps-common';

const AuditTable = () => {
  const api = useApi(opaApiRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    isError: boolean;
    errorMsg: string | null;
  }>({ isError: false, errorMsg: null });
  const [items, setItems] = useState<AuditRecord[]>([]);

  useEffect(() => {
    async function getAuditDetails() {
      return api.getAuditDetails();
    }
    getAuditDetails()
      .then(results => {
        setLoading(false);
        if (results.Count! > 0 && results.Items) {
          const auditRecords = results.Items.map(item => {
            const auditRecord: AuditRecord = {
              id: item.id.S ?? '',
              origin: item.origin.S ?? '',
              actionType: item.actionType.S ?? '',
              actionName: item.actionName.S ?? '',
              appName: item.appName.S ?? '',
              createdDate: item.createdDate.S ?? '',
              createdAt: item.createdAt.S ?? '',
              initiatedBy: item.initiatedBy.S ?? '',
              owner: item.owner.S ?? '',
              assumedRole: item.assumedRole.S ?? '',
              targetAccount: item.targetAccount.S ?? '',
              targetRegion: item.targetRegion.S ?? '',
              prefix: item.prefix.S ?? '',
              providerName: item.providerName.S ?? '',
              request: item.request.S ?? '',
              status: item.status.S ?? '',
              message: item.message.S ?? '',
            };

            return auditRecord;
          });
          setItems(auditRecords);
          setError({ isError: false, errorMsg: '' });
        }
      })
      .catch(err => {
        setLoading(false);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while retrieving audit data: ${err}`,
        });
      });
  }, [api]);

  const columns: TableColumn[] = [
    {
      title: 'Record ID',
      field: 'id',
      highlight: true,
    },
    {
      title: 'Origin',
      field: 'origin',
    },
    {
      title: 'Action Type',
      field: 'actionType',
    },
    {
      title: 'Action Name',
      field: 'actionName',
    },
    {
      title: 'Create Date',
      field: 'createdDate',
      type: 'date',
    },
    {
      title: 'Create At',
      field: 'createdAt',
    },
    {
      title: 'Initiated By',
      field: 'initiatedBy',
    },
    {
      title: 'Owner',
      field: 'owner',
    },
    {
      title: 'Assumed Role',
      field: 'assumedRole',
    },
    {
      title: 'Target Account',
      field: 'targetAccount',
    },
    {
      title: 'Target Region',
      field: 'targetRegion',
    },
    {
      title: 'Prefix',
      field: 'prefix',
    },
    {
      title: 'Provider Name',
      field: 'providerName',
    },
    {
      title: 'Request',
      field: 'request',
    },
    {
      title: 'Status',
      field: 'status',
    },
    {
      title: 'Message',
      field: 'message',
    },
  ];
  if (error.isError) {
    return <Typography sx={{ color: 'red' }}>{error.errorMsg}</Typography>;
  }

  return (
    <div>
      <Table
        options={{ paging: true }}
        data={items}
        columns={columns}
        title="Audit Table"
        isLoading={loading}
      />
    </div>
  );
};

export const AuditWidget = () => {
  const awsAppLoadingStatus = useAsyncAwsApp();

  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    // const input = {
    //   awsComponent: awsAppLoadingStatus.component
    // };
    return <AuditTable />;
  }
  return (
    <EmptyState
      missing="data"
      title="No audit data to show"
      description="Audit data would show here"
    />
  );
};
