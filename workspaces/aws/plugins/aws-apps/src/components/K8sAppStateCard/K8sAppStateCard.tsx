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

import { InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { GetParameterCommandOutput } from '@aws-sdk/client-ssm';
import {
  AppState,
  AppStateType,
  AWSComponent,
  AWSEKSAppDeploymentEnvironment,
  getGitCredentailsSecret,
  KeyValue,
} from '@alithya-oss/backstage-plugin-aws-apps-common';
import { Entity } from '@backstage/catalog-model';
import { EmptyState, InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  Button,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@material-ui/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { opaApiRef } from '../../api';
import { base64PayloadConvert } from '../../helpers/util';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import { useCancellablePromise } from '../../hooks/useCancellablePromise';

const OpaAppStateOverview = ({
  input: { env, entity, awsComponent },
}: {
  input: {
    env: AWSEKSAppDeploymentEnvironment;
    entity: Entity;
    awsComponent: AWSComponent;
  };
}) => {
  const api = useApi(opaApiRef);
  const [appStateData, setAppStateData] = useState<AppState[]>([]);
  const [variablesJson, setVariablesJson] = useState<any>({});
  const [appStarted, setAppStarted] = useState(false);
  const [appStopped, setAppStopped] = useState(false);
  const [clusterNameState, setClusterNameState] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    isError: boolean;
    errorMsg: string | null;
  }>({ isError: false, errorMsg: null });
  const { cancellablePromise } = useCancellablePromise({
    rejectOnCancel: true,
  });
  const timerRef = useRef<any>(null);
  const repoInfo = awsComponent.getRepoInfo();

  // Namespace-bound application admin role (not cluster admin role)
  const appAdminRoleArn = env.app.appAdminRoleArn;

  const kubectlLambdaArn =
    env.entities.envProviderEntity?.metadata.kubectlLambdaArn?.toString() || '';
  let clusterNameParam;
  let clusterName: string;

  async function fetchAppConfig() {
    if (!clusterName) {
      // console.log(`getting cluster name`);
      clusterNameParam = await cancellablePromise<GetParameterCommandOutput>(
        api.getSSMParameter({ ssmParamName: env.clusterName }),
      );
      clusterName =
        clusterNameParam.Parameter?.Value?.toString()
          .split('/')[1]
          .toString() || '';
    } else {
      // console.log(`clusterName was already cached when getting app config`);
    }

    setClusterNameState(clusterName);

    const bodyParamVariables = {
      RequestType: 'Create',
      ResourceType: 'Custom::AWSCDK-EKS-KubernetesObjectValue',
      ResourceProperties: {
        TimeoutSeconds: '5',
        ClusterName: clusterName,
        RoleArn: appAdminRoleArn,
        ObjectNamespace: env.app.namespace,
        InvocationType: 'RequestResponse',
        ObjectType: 'configmaps',
        ObjectLabels: `app.kubernetes.io/env=${env.environment.name},app.kubernetes.io/name=${entity.metadata.name}`,
        JsonPath: '@',
      },
    };

    // console.log(`calling lambda to get configs`);
    const resultsVariables = await cancellablePromise<InvokeCommandOutput>(
      api.invokeLambda({
        functionName: kubectlLambdaArn,
        actionDescription: `Fetch app configs for namespace ${env.app.namespace}`,
        body: JSON.stringify(bodyParamVariables),
      }),
    );
    // console.log(`got configs`);

    try {
      if (resultsVariables?.Payload) {
        const payloadVariablesString = base64PayloadConvert(
          resultsVariables.Payload as Object,
        );
        const payloadVariablesJson = JSON.parse(payloadVariablesString);

        if (payloadVariablesJson?.Data?.Value) {
          return JSON.parse(payloadVariablesJson.Data.Value);
        }
        return {};
      }
      return null;
    } catch (err) {
      throw Error("Can't parse json response");
    }
  }

  async function fetchAppState(): Promise<any> {
    if (!clusterName) {
      // console.log(`getting cluster name`);
      clusterNameParam = await cancellablePromise<GetParameterCommandOutput>(
        api.getSSMParameter({ ssmParamName: env.clusterName }),
      );
      // console.log(`DONE getting cluster name`);
      clusterName =
        clusterNameParam.Parameter?.Value?.toString()
          .split('/')[1]
          .toString() || '';
      // console.log(`clusterName is ${clusterName}`);
    }

    const bodyParam = {
      RequestType: 'Create',
      ResourceType: 'Custom::AWSCDK-EKS-KubernetesObjectValue',
      ResourceProperties: {
        TimeoutSeconds: '5',
        ClusterName: clusterName,
        RoleArn: appAdminRoleArn,
        ObjectNamespace: env.app.namespace,
        InvocationType: 'RequestResponse',
        ObjectType: 'deployments',
        ObjectLabels: `app.kubernetes.io/env=${env.environment.name},app.kubernetes.io/name=${entity.metadata.name}`,
        JsonPath: '@',
      },
    };

    //  console.log(bodyParam)
    // console.log(`calling lambda to get manifests`);
    const results = await cancellablePromise<InvokeCommandOutput>(
      api.invokeLambda({
        functionName: kubectlLambdaArn,
        actionDescription: `Fetch deployments for namespace ${env.app.namespace}`,
        body: JSON.stringify(bodyParam),
      }),
    );
    // console.log(`got manifests`);

    try {
      if (results?.Payload) {
        const payloadString = base64PayloadConvert(results.Payload as Object);
        const payloadJson = JSON.parse(payloadString);
        if (payloadJson?.Data?.Value) {
          return JSON.parse(payloadJson.Data.Value).items;
        }
        return {};
      }
      return null;
    } catch (err) {
      // console.log(err);
      throw Error("Can't parse json response");
    }
  }

  const getDeploymentEnvVars = (deploymentName: string): KeyValue[] => {
    if (!appStateData || !variablesJson) {
      return [];
    }

    const configMapName = appStateData.filter(
      appState => appState.appID === deploymentName,
    )[0].stateObject.spec.template.spec.containers[0]?.envFrom?.[0]
      ?.configMapRef?.name;

    if (!configMapName) {
      return [];
    }

    const configMap = variablesJson.items.filter(
      (candidateMap: any) => candidateMap.metadata.name === configMapName,
    )?.[0];

    if (!configMap) {
      return [];
    }

    const variables: KeyValue[] = [];
    Object.keys(configMap.data).forEach((key: string, index: number) => {
      variables.push({
        id: `${index}`,
        key: key.toString(),
        value: configMap.data[key].toString(),
      });
    });
    return variables;
  };

  const parseState = (deploymentsJson: any): AppState[] => {
    // parse response JSON

    const deploymentsState: AppState[] = [];
    try {
      Object.keys(deploymentsJson).forEach(key => {
        const deploymentJson = deploymentsJson[key];

        const updatedReplicas =
          Number.parseInt(deploymentJson.status.updatedReplicas, 10) || 0;
        const appRunning =
          Number.parseInt(deploymentJson.status.readyReplicas, 10) || 0;

        const pending = Math.abs(appRunning - updatedReplicas);

        let appStateDescription;
        if (pending) {
          appStateDescription = AppStateType.UPDATING;
        } else {
          appStateDescription =
            appRunning > 0 ? AppStateType.RUNNING : AppStateType.STOPPED;
        }

        const appState: AppState = {
          appID: deploymentJson.metadata.name,
          appState: appStateDescription,
          deploymentIdentifier: deploymentJson.metadata.uid,
          desiredCount: Number.parseInt(deploymentJson.spec.replicas, 10) || 0,
          pendingCount: pending,
          runningCount: appRunning,
          lastStateTimestamp: new Date(
            deploymentJson.status.conditions[0].lastUpdateTime,
          ),
          stateObject: deploymentJson,
        };

        deploymentsState.push(appState);
      });
    } catch (err) {
      // console.log(err);
    }
    return deploymentsState || [];
  };

  const getData = useCallback(async (appStateResults?: any) => {
    let isCanceled = false;
    let isError = false;
    let deploymentsJson;
    let appConfig;
    try {
      if (appStateResults) {
        // console.log(`reusing appStateResults`);
      }

      deploymentsJson = appStateResults
        ? appStateResults
        : await fetchAppState(); // returns array of deployments
      appConfig = await fetchAppConfig(); // return the configMaps for the app
    } catch (e) {
      if ((e as any).isCanceled) {
        isCanceled = true;
        // console.log(`got cancellation in getData`);
      } else {
        isError = true;
        // console.error(e);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while retrieving event data: ${e}`,
        });
      }
    }

    if (!isCanceled && !isError) {
      const states = parseState(deploymentsJson);

      setAppStateData(states);
      setVariablesJson(appConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAppStateData([]); // reset existing state
    getData()
      .then(() => {
        setLoading(false);
        setError({ isError: false, errorMsg: '' });
      })
      .catch(e => {
        setLoading(false);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while retrieving app data: ${e}`,
        });
      });

    return () => {
      // prevent sleeping while-loops from continuing
      setAppStarted(true);
      setAppStopped(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // console.log(`Clearing Timeout`);
      }
    };
  }, [getData]);

  function sleep(ms: number) {
    return new Promise(resolve => {
      const resolveHandler = () => {
        clearTimeout(timerRef.current);
        resolve(null);
      };
      timerRef.current = setTimeout(resolveHandler, ms);
    });
  }

  const handleStartTask = async (appState: AppState) => {
    setLoading(true);

    // console.log(`calling lambda to set replicas to > 0, clusterNameState is ${clusterNameState}`);

    let isCanceled = false;
    try {
      await cancellablePromise(
        api.updateEKSApp({
          actionDescription: `Starting app in environment ${env.environment.name}`,
          envName: env.environment.name,
          cluster: clusterNameState,
          kubectlLambda:
            env.entities.envProviderEntity?.metadata.kubectlLambdaArn?.toString() ||
            '',
          lambdaRoleArn: appAdminRoleArn,
          gitAdminSecret: getGitCredentailsSecret(repoInfo),
          updateKey: 'spec.replicas',
          updateValue: appState.desiredCount || 1,
          repoInfo,
        }),
      );
      // console.log(`DONE setting replicas to > 0`);
    } catch (e) {
      if ((e as any).isCanceled) {
        isCanceled = true;
      } else {
        // console.error(e);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while starting app: ${e}`,
        });
        setLoading(false);
      }
    }

    let deploymentsJson: any;
    let count = 0;
    let localAppStarted = false;
    // console.log(`isCanceled is ${isCanceled} and localAppStarted is ${localAppStarted} and appStarted is ${appStarted}`);
    while (!isCanceled && !appStarted && !localAppStarted) {
      // console.log(`sleeping waiting for app to be started, localAppStarted is ${localAppStarted} and appStarted is ${appStarted}`);
      await sleep(5000);
      // console.log(`awake ${count}, will now check app state`);
      count++;

      try {
        // console.log("start fetching app state");
        const appStateJson = await fetchAppState();
        // console.log("DONE fetching app state");
        let isStarted = false;

        Object.keys(appStateJson).forEach(key => {
          const currState = appStateJson[key];

          if (currState.metadata.uid === appState.deploymentIdentifier) {
            if (Number.parseInt(currState.status.readyReplicas, 10) > 0) {
              setAppStateData([]); // reset existing state
              setAppStarted(true);
              isStarted = true;
            }
          }
        });

        localAppStarted = isStarted;
        deploymentsJson = appStateJson;

        if (localAppStarted || appStarted) {
          // console.log("breaking from while loop since app was started");
          break;
        } else {
          // console.log("not breaking from while loop since appStarted is falsy");
        }
      } catch (e) {
        if ((e as any).isCanceled) {
          isCanceled = true;
        } else {
          // console.error(e);
          setError({
            isError: true,
            errorMsg: `Unexpected error occurred while retrieving app state: ${e}`,
          });
          setAppStarted(true);
          localAppStarted = true;
          // console.log(`setting appStarted to true`);
          setLoading(false);
        }
        break;
      }
    }

    if (!isCanceled && localAppStarted) {
      await getData(deploymentsJson);
      setLoading(false);
    }
  };

  const handleStopTask = async (appState: AppState) => {
    setLoading(true);

    // console.log(`calling lambda to set replicas to 0 when clusterNameState is ${clusterNameState}`);

    let isCanceled = false;
    try {
      await cancellablePromise(
        api.updateEKSApp({
          actionDescription: `Stopping app in environment ${env.environment.name}`,
          envName: env.environment.name,
          cluster: clusterNameState,
          kubectlLambda:
            env.entities.envProviderEntity?.metadata.kubectlLambdaArn?.toString() ||
            '',
          lambdaRoleArn: appAdminRoleArn,
          gitAdminSecret: getGitCredentailsSecret(repoInfo),
          updateKey: 'spec.replicas',
          updateValue: 0,
          repoInfo,
        }),
      );
      // console.log(`DONE setting replicas to 0`);
    } catch (e) {
      if ((e as any).isCanceled) {
        isCanceled = true;
      } else {
        // console.error(e);
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while stopping app: ${e}`,
        });
        setLoading(false);
      }
    }

    let count = 0;
    let localAppStopped = false;
    // console.log(`isCanceled is ${isCanceled} and localAppStopped is ${localAppStopped} and appStoped is ${appStopped}`);
    while (!isCanceled && !appStopped && !localAppStopped) {
      // console.log(`sleeping ${count} - waiting for app to be stopped, localAppStopped is ${localAppStopped} and appStoped is ${appStopped}`);
      await sleep(7000);
      // console.log(`DONE sleeping - app is stopped`);
      count++;

      try {
        // console.log("fetching app state");
        const deploymentsJson = await fetchAppState();
        // console.log("DONE - fetching app state");

        for (const key of Object.keys(deploymentsJson)) {
          const currState = deploymentsJson[key];
          if (currState.metadata.uid === appState.deploymentIdentifier) {
            if (
              !currState.status.readyReplicas ||
              Number.parseInt(currState.status.readyReplicas, 10) === 0
            ) {
              appState.appState = AppStateType.STOPPED;
              appState.runningCount = 0;
              localAppStopped = true;
              setAppStopped(true);
              setLoading(false);
              // console.log(`setting appStopped to true and loading to false`);
            }
          }
        }

        if (localAppStopped || appStopped) {
          // console.log(`breaking from while loop since app was stopped`);
          break;
        }
      } catch (e) {
        if ((e as any).isCanceled) {
          isCanceled = true;
        } else {
          // console.error(e);
          setError({
            isError: true,
            errorMsg: `Unexpected error occurred while retrieving app state: ${e}`,
          });
          setLoading(false);
          setAppStopped(true);
          localAppStopped = true;
          // console.log(`setting appStopped to true and loading to false`);
        }
        break;
      }
    }
  };

  const EnvVars = ({ appID }: { appID: string }) => {
    const envVarArr = getDeploymentEnvVars(appID);

    if (envVarArr && envVarArr.length) {
      return (
        <>
          {envVarArr.map(envVar => (
            <TableRow key={envVar.id}>
              <TableCell>
                <Typography style={{ fontWeight: 'bold' }}>
                  {envVar.key}
                </Typography>
              </TableCell>
              <TableCell width="55%">{envVar.value}</TableCell>
            </TableRow>
          ))}
        </>
      );
    }
    return (
      <TableRow key="clusterName">
        <TableCell id="noneConfigured" width="30%">
          None configured
        </TableCell>
        <TableCell id="providerName" />
      </TableRow>
    );
  };

  const DeploymentCard = ({
    deploymentState,
    index,
    total,
  }: {
    deploymentState: AppState;
    index: number;
    total: number;
  }) => {
    return (
      <>
        <Grid container style={{ marginBottom: 16 }}>
          <Grid item xs={6}>
            <Typography
              style={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                paddingBottom: '10px',
              }}
            >
              Deployment {index > 1 ? index : ''}
            </Typography>
            <div>
              {deploymentState?.appState ? (
                <Grid container>
                  <Grid item xs={1} />
                  <Grid item xs={11}>
                    <Table size="small" padding="none">
                      <TableBody>
                        <TableRow key="deploymentName">
                          <TableCell id="name" width="30%">
                            <Typography style={{ fontWeight: 'bold' }}>
                              Name
                            </Typography>
                          </TableCell>
                          <TableCell id="providerName">
                            {deploymentState.stateObject.metadata.name}
                          </TableCell>
                        </TableRow>
                        <TableRow key="status">
                          <TableCell id="status" width="30%">
                            <Typography style={{ fontWeight: 'bold' }}>
                              Status
                            </Typography>
                          </TableCell>
                          <TableCell id="appStatus">
                            {deploymentState?.appState
                              ? deploymentState?.appState
                              : 'Not Running'}
                          </TableCell>
                        </TableRow>
                        <TableRow key="pods">
                          <TableCell id="id" width="30%">
                            <Typography style={{ fontWeight: 'bold' }}>
                              Pods
                            </Typography>
                          </TableCell>
                          <TableCell id="providerName">
                            {`${deploymentState?.runningCount}/${deploymentState?.desiredCount}`}
                            {deploymentState?.pendingCount
                              ? ` (${deploymentState?.pendingCount} Pending)`
                              : ''}
                          </TableCell>
                        </TableRow>
                        <TableRow key="lastUpdated">
                          <TableCell id="id" width="30%">
                            <Typography style={{ fontWeight: 'bold' }}>
                              Last Updated
                            </Typography>
                          </TableCell>
                          <TableCell id="providerName">
                            {deploymentState?.lastStateTimestamp
                              ? deploymentState?.lastStateTimestamp.toString()
                              : ''}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Grid>
                </Grid>
              ) : (
                <></>
              )}
            </div>
          </Grid>
          <Divider
            orientation="vertical"
            flexItem
            style={{ marginRight: '-1px' }}
          />
          <Grid
            item
            zeroMinWidth
            xs={6}
            style={{ paddingLeft: 8, paddingRight: 8 }}
          >
            <Typography
              style={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                paddingBottom: '10px',
              }}
            >
              Environment Variables
            </Typography>
            <Grid container>
              <Grid item xs={1} />
              <Grid item xs={11}>
                <Table size="small" padding="none">
                  <TableBody>
                    <EnvVars appID={deploymentState.appID as string} />
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid container>
          <Grid item xs={12}>
            {index === total &&
            deploymentState?.appState === AppStateType.STOPPED ? (
              <div style={{ float: 'left', marginRight: '10px' }}>
                <TextField
                  type="number"
                  placeholder="Number of pods"
                  defaultValue={1}
                  onChange={event =>
                    (deploymentState.desiredCount =
                      Number(event.target.value) || 0)
                  }
                  inputProps={{ min: 0, max: 10 }}
                  size="small"
                  style={{ width: '6rem' }}
                />
              </div>
            ) : (
              <></>
            )}
            {index === total ? (
              <>
                <Button
                  style={{ marginRight: 16 }}
                  variant="outlined"
                  size="small"
                  disabled={
                    deploymentState?.appState !== AppStateType.STOPPED
                      ? true
                      : false
                  }
                  onClick={() => handleStartTask(deploymentState)}
                >
                  Start
                </Button>
                <Button
                  style={{ marginRight: 16 }}
                  variant="outlined"
                  size="small"
                  disabled={
                    deploymentState?.appState === AppStateType.STOPPED
                      ? true
                      : false
                  }
                  onClick={() => handleStopTask(deploymentState)}
                >
                  Stop
                </Button>
                <Typography
                  style={{
                    fontStyle: 'italic',
                    fontSize: '12px',
                    marginTop: 8,
                  }}
                >
                  {' '}
                  **Changes to your application state will be applied directly
                  to the cluster and not to the source code repository
                </Typography>
              </>
            ) : (
              <></>
            )}
          </Grid>
        </Grid>
      </>
    );
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
        <Grid container>
          <Grid item xs={5}>
            <Typography
              style={{
                textTransform: 'uppercase',
                fontWeight: 'bold',
                paddingBottom: '10px',
              }}
            >
              Cluster Info
            </Typography>
            <Grid container>
              <Grid item xs={1} />
              <Grid item xs={11}>
                <Table size="small" padding="none">
                  <TableBody>
                    <TableRow key="clusterName">
                      <TableCell id="id" width="30%">
                        <Typography style={{ fontWeight: 'bold' }}>
                          Cluster Name
                        </Typography>
                      </TableCell>
                      <TableCell id="providerName">
                        {clusterNameState}
                      </TableCell>
                    </TableRow>
                    <TableRow key="namespace">
                      <TableCell id="id" width="30%">
                        <Typography style={{ fontWeight: 'bold' }}>
                          Namespace
                        </Typography>
                      </TableCell>
                      <TableCell id="providerName">
                        {env.app.namespace}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid
          container
          direction="column"
          spacing={2}
          style={{ marginTop: 16 }}
        >
          {appStateData.length ? (
            appStateData.map((state, index, array) => {
              return (
                <DeploymentCard
                  key={state.deploymentIdentifier}
                  deploymentState={state}
                  index={index + 1}
                  total={array.length}
                />
              );
            })
          ) : (
            <>No Deployments Found</>
          )}
        </Grid>
      </CardContent>
    </InfoCard>
  );
};

export const K8sAppStateCard = () => {
  const { entity } = useEntity();
  const awsAppLoadingStatus = useAsyncAwsApp();

  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    let input;
    if (awsAppLoadingStatus.component.componentSubType === 'aws-eks') {
      const env = awsAppLoadingStatus.component
        .currentEnvironment as AWSEKSAppDeploymentEnvironment;
      input = {
        env,
        entity,
        awsComponent: awsAppLoadingStatus.component,
      };
      return <OpaAppStateOverview input={input} />;
    }
    return (
      <EmptyState
        missing="data"
        title="Can't render EKS app state card"
        description="Missing supported spec.subType"
      />
    );
  }
  return (
    <EmptyState
      missing="data"
      title="No state data to show"
      description="State data would show here"
    />
  );
};
