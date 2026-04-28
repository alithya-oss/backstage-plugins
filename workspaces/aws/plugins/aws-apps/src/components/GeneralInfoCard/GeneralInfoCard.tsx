// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';
import { CodeSnippet, InfoCard, EmptyState } from '@backstage/core-components';
import {
  CardContent,
  Grid,
  IconButton,
  LinearProgress,
  Typography,
} from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { OPAApi, opaApiRef } from '../../api';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { SecretStringComponent } from '../common';
import { useAsyncAwsApp } from '../../hooks/useAwsApp';
import {
  AWSECSAppDeploymentEnvironment,
  getRepoInfo,
  getRepoUrl,
} from '@alithya-oss/backstage-plugin-aws-apps-common';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

const OpaAppGeneralInfo = ({
  input: { entity, repoSecretArn, api },
}: {
  input: {
    account: string;
    region: string;
    entity: Entity;
    repoSecretArn: string;
    api: OPAApi;
  };
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{
    isError: boolean;
    errorMsg: string | null;
  }>({ isError: false, errorMsg: null });

  const [secretData, setSecretData] = useState('');

  const repoInfo = getRepoInfo(entity);
  const gitRepoUrl = getRepoUrl(repoInfo);

  // const getGitAppUrl = () => {
  //     const gitAppUrl = gitHost + "/" + gitApp + ".git"
  //     return gitAppUrl
  //   }

  const HandleCopyGitClone = () => {
    let baseUrl: string = 'git clone https://oauth2:';
    let cloneUrl: string;
    if (!repoSecretArn) {
      baseUrl = 'git clone https://';
      cloneUrl = baseUrl + gitRepoUrl;
    } else {
      cloneUrl = `${baseUrl + secretData}@${gitRepoUrl}`;
    }
    navigator.clipboard.writeText(cloneUrl);
  };

  const HandleCopySecret = () => {
    navigator.clipboard.writeText(secretData || '');
  };

  useEffect(() => {
    async function getData() {
      if (!repoSecretArn) {
        setSecretData('');
      } else {
        const secrets = await api.getPlatformSecret({
          secretName: repoSecretArn,
        });
        setSecretData(secrets.SecretString ?? '');
      }
    }

    getData()
      .then(() => {
        setLoading(false);
        setError({ isError: false, errorMsg: '' });
      })
      .catch(e => {
        setError({
          isError: true,
          errorMsg: `Unexpected error occurred while retrieving secrets manager data: ${e}`,
        });
        setLoading(false);
      });
  }, [api, repoSecretArn]);

  if (loading) {
    return (
      <InfoCard title="General Information">
        <LinearProgress />
        <Typography>Loading...</Typography>{' '}
      </InfoCard>
    );
  }
  if (error.isError) {
    return <InfoCard title="General Information">{error.errorMsg}</InfoCard>;
  }
  return (
    <InfoCard title="General Information">
      <CardContent>
        <Grid container direction="column" spacing={2}>
          <Grid container>
            <Grid item zeroMinWidth xs={8}>
              {repoSecretArn ? (
                <>
                  <Typography
                    style={{ textTransform: 'uppercase', fontWeight: 'bold' }}
                  >
                    Repository Access Token
                  </Typography>
                  <Typography noWrap>
                    <IconButton
                      style={{ padding: 0 }}
                      onClick={HandleCopySecret}
                    >
                      <FileCopyIcon />
                    </IconButton>
                    <SecretStringComponent secret={secretData ?? ''} />
                  </Typography>
                </>
              ) : (
                <></>
              )}
            </Grid>
            <Grid item zeroMinWidth xs={12}>
              <Typography
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  marginTop: 8,
                }}
              >
                Clone url
              </Typography>
              <Typography component="span" noWrap>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        <IconButton
                          style={{ padding: 0 }}
                          onClick={HandleCopyGitClone}
                        >
                          <FileCopyIcon />
                        </IconButton>
                      </td>
                      <td>
                        <CodeSnippet
                          language="text"
                          text={`git clone https://${gitRepoUrl}`}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Typography>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </InfoCard>
  );
};

export const GeneralInfoCard = ({ appPending }: { appPending: boolean }) => {
  const api = useApi(opaApiRef);
  const { entity } = useEntity();
  const awsAppLoadingStatus = useAsyncAwsApp();
  if (appPending) {
    const input = {
      account: '',
      region: '',
      entity: entity,
      repoSecretArn: entity.metadata.repoSecretArn?.toString() ?? '',
      api,
    };
    return <OpaAppGeneralInfo input={input} />;
  }
  if (awsAppLoadingStatus.loading) {
    return <LinearProgress />;
  } else if (awsAppLoadingStatus.component) {
    const env = awsAppLoadingStatus.component
      .currentEnvironment as AWSECSAppDeploymentEnvironment;

    const input = {
      account: env.providerData.accountNumber,
      region: env.providerData.region,
      entity: entity,
      repoSecretArn: awsAppLoadingStatus.component.repoSecretArn,
      api,
    };
    return <OpaAppGeneralInfo input={input} />;
  }
  return (
    <EmptyState
      missing="data"
      title="No info data to show"
      description="Info data would show here"
    />
  );
};
