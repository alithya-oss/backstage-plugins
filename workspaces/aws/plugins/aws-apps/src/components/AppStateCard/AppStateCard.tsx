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

import { Task } from '@aws-sdk/client-ecs';
import { InfoCard, EmptyState } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  Button,
  CardContent,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useEffect, useState } from 'react';
import { opaApiRef } from '../../api';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import {
  AWSComponent,
  AWSECSAppDeploymentEnvironment,
} from '@alithya-oss/backstage-plugin-aws-apps-common';

const OpaAppStateOverview = ({
  input: { cluster, serviceArn, taskDefArn },
}: {
  input: {
    cluster: string;
    serviceArn: string;
    taskDefArn: string;
    awsComponent: AWSComponent;
  };
}) => {
  const api = useApi(opaApiRef);

  const [taskData, setTaskData] = useState<Task>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    isError: boolean;
    errorMsg: string | null;
  }>({ isError: false, errorMsg: null });

  /*
  Gets the details of a task
  Also take in wait (boolean) parameter to just add sleep
  before api call to backend
  */
  async function getTaskDetails() {
    await sleep(5000);
    return api.getTaskDetails({
      cluster: cluster,
      service: serviceArn,
    });
  }

  useEffect(() => {
    /* gets cluster, account, region from entity and also task Data */
    async function getData() {
      const tasks = await api.getTaskDetails({
        cluster,
        service: serviceArn,
      });
      setTaskData(tasks);
    }

    getData()
      .then(() => {
        setLoading(false);
        setError({ isError: false, errorMsg: '' });
      })
      .catch(e => {
        setLoading(false);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while retrieving task data: ${e}`,
        });
      });
  }, [api, cluster, serviceArn]);

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleStartTask = async () => {
    await api.updateService({
      cluster: cluster,
      service: serviceArn,
      desiredCount: 1,
      restart: false,
      taskDefinition: taskDefArn,
    });
    setLoading(true);

    let getTaskResult;
    do {
      getTaskResult = await getTaskDetails();
    } while (!getTaskResult.taskArn);

    setLoading(false);
    setTaskData(getTaskResult);

    while (getTaskResult.lastStatus !== 'RUNNING') {
      getTaskResult = await getTaskDetails();
      setTaskData(getTaskResult);
    }
  };

  const handleStopTask = async () => {
    await api.updateService({
      cluster: cluster,
      service: serviceArn,
      desiredCount: 0,
      restart: false,
      taskDefinition: taskDefArn,
    });
    let getTaskResult;
    setLoading(true);
    do {
      getTaskResult = await getTaskDetails();
    } while (getTaskResult?.taskArn);
    setLoading(false);
    setTaskData(getTaskResult);
  };

  if (loading) {
    return (
      <InfoCard title="Application State">
        <LinearProgress />
        <Typography style={{ color: '#645B59', marginTop: 16 }}>
          Loading current state...
        </Typography>
      </InfoCard>
    );
  }
  if (error.isError) {
    return <InfoCard title="Application State">{error.errorMsg}</InfoCard>;
  }

  return (
    <InfoCard title="Application State">
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid container>
            <Grid item xs={4}>
              <Typography
                style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              >
                Status
              </Typography>
              <Typography style={{ marginTop: 8 }}>
                {taskData?.lastStatus
                  ? taskData?.lastStatus
                  : 'No Task Running'}
              </Typography>
            </Grid>
            <Divider
              orientation="vertical"
              flexItem
              style={{ marginRight: '-1px' }}
            />
            <Grid
              item
              zeroMinWidth
              xs={4}
              style={{ paddingLeft: 8, paddingRight: 8 }}
            >
              <Typography
                style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              >
                Task Arn
              </Typography>
              <Typography noWrap style={{ marginTop: 8 }}>
                <IconButton style={{ padding: 0 }}>
                  <FileCopyIcon />
                </IconButton>

                {taskData?.taskArn ? taskData?.taskArn : 'No Task Running'}
              </Typography>
            </Grid>
            <Divider
              orientation="vertical"
              flexItem
              style={{ marginRight: '-1px' }}
            />
            <Grid item xs={4} style={{ paddingLeft: 8 }}>
              <Typography
                style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
              >
                Created At
              </Typography>
              <Typography style={{ marginTop: 8 }}>
                {taskData?.createdAt
                  ? taskData?.createdAt.toString()
                  : 'No Task Running'}
              </Typography>
            </Grid>
          </Grid>
          <Grid item>
            <Button
              style={{ marginRight: 16 }}
              variant="outlined"
              size="small"
              disabled={!!taskData.taskArn}
              onClick={handleStartTask}
            >
              Start Task
            </Button>
            <Button
              style={{ marginRight: 16 }}
              variant="outlined"
              size="small"
              disabled={!taskData.taskArn}
              onClick={handleStopTask}
            >
              Stop Task
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </InfoCard>
  );
};

export const AppStateCard = () => {
  const awsAppLoadingStatus = useAsyncAwsApp();

  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    const env = awsAppLoadingStatus.component
      .currentEnvironment as AWSECSAppDeploymentEnvironment;
    const latestTaskDef = env.app.taskDefArn.substring(
      0,
      env.app.taskDefArn.lastIndexOf(':'),
    );
    const input = {
      cluster: env.clusterName,
      serviceArn: env.app.serviceArn,
      taskDefArn: latestTaskDef,
      awsComponent: awsAppLoadingStatus.component,
    };
    return <OpaAppStateOverview input={input} />;
  }
  return (
    <EmptyState
      missing="data"
      title="No state data to show"
      description="State data would show here"
    />
  );
};
