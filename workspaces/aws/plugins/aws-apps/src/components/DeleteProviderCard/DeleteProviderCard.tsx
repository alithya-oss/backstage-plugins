// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Entity } from '@backstage/catalog-model';
import { InfoCard } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  CatalogApi,
  catalogApiRef,
  useEntity,
} from '@backstage/plugin-catalog-react';
import { Button, CardContent, Grid } from '@material-ui/core';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { opaApiRef } from '../../api';
import { sleep } from '../../helpers/util';
import {
  getGitCredentailsSecret,
  getRepoInfo,
} from '@alithya-oss/backstage-plugin-aws-apps-common';

const DeleteProviderPanel = ({
  input: { entity, catalogApi },
}: {
  input: { entity: Entity; catalogApi: CatalogApi };
}) => {
  const [spinning, setSpinning] = useState(false);
  const [isDeleteSuccessful, setIsDeleteSuccessful] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState('');
  const api = useApi(opaApiRef);
  const navigate = useNavigate();
  const stackName = entity.metadata.stackName?.toString() ?? '';
  const prefix = entity.metadata.prefix?.toString() ?? '';
  const awsAccount = entity.metadata.awsAccount?.toString() ?? '';
  const awsRegion = entity.metadata.awsRegion?.toString() ?? '';
  const backendParamsOverrides = {
    appName: '',
    awsAccount: awsAccount,
    awsRegion: awsRegion,
    prefix: prefix,
    providerName: entity.metadata.name,
  };

  const handleCloseAlert = () => {
    setDeleteResultMessage('');
  };

  const [disabled, setDisabled] = useState(false);
  const repoInfo = getRepoInfo(entity);

  const deleteRepo = () => {
    api
      .deleteRepository({
        repoInfo,
        gitAdminSecret: getGitCredentailsSecret(repoInfo),
      })
      .then(() => {
        setDeleteResultMessage('Gitlab Repository deleted.');
        setIsDeleteSuccessful(true);
      })
      .catch(error => {
        setDeleteResultMessage(`Error deleting Repository ${error}.`);
        setSpinning(false);
        setIsDeleteSuccessful(false);
      });
  };

  const deleteFromCatalog = async () => {
    setDeleteResultMessage('Deleting entity from backstage catalog');
    // The entity will be removed from the catalog along with the auto-generated Location kind entity
    // which references the catalog entity
    const uid = entity.metadata.uid ?? '';
    const entityAnnotations = entity.metadata.annotations || {};
    const entityLocation =
      entityAnnotations['backstage.io/managed-by-location'] || '';
    const entityLocationRef = await catalogApi.getLocationByRef(entityLocation);
    if (entityLocationRef) {
      await catalogApi.removeLocationById(entityLocationRef.id);
    }
    await catalogApi.removeEntityByUid(uid);
  };

  const isExistingComponents = () => {
    let result: boolean = false;
    entity.relations?.forEach(et => {
      if (et.targetRef.startsWith('awsenvironment')) {
        result = true;
      }
    });
    return result;
  };

  const handleClickDelete = () => {
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to delete this provider?')) {
      if (isExistingComponents()) {
        setDeleteResultMessage(
          'There are Environments associated with this provider, Please disassociate the provider from the environment page and try again.',
        );
        setIsDeleteSuccessful(false);
        setSpinning(false);
        return;
      }
      const iacType = entity.metadata.iacType?.toString() ?? '';
      setSpinning(true);
      if (iacType === 'cloudformation' || iacType === 'cdk') {
        api
          .deleteStack({
            componentName: entity.metadata.name,
            stackName,
            backendParamsOverrides,
          })
          .then(async () => {
            setIsDeleteSuccessful(true);
            setDeleteResultMessage('Cloud Formation stack delete initiated.');
            await sleep(2000);
            // Delete the repo now.
            deleteRepo();
            await sleep(2000);
            await deleteFromCatalog();
            setSpinning(false);
            await sleep(2000);
            setDeleteResultMessage('Redirect to home ....');
            setDisabled(false);
            navigate('/');
          })
          .catch(error => {
            setSpinning(false);
            setIsDeleteSuccessful(false);
            setDeleteResultMessage(error.toString());
            setDisabled(false);
          });
      } else if (iacType === 'terraform') {
        const terraRepoInfo = getRepoInfo(entity);
        const params = {
          backendParamsOverrides,
          repoInfo: terraRepoInfo,
          gitAdminSecret: getGitCredentailsSecret(terraRepoInfo),
          envName: '', // no env - provider needs to be detached.
        };
        api
          .deleteTFProvider(params)
          .then(async () => {
            setIsDeleteSuccessful(true);
            setDeleteResultMessage('Cloud Formation stack delete initiated.');
            await sleep(2000);
            // deleteRepo();
            await deleteFromCatalog();
            setSpinning(false);
            await sleep(2000);
            setDeleteResultMessage('Redirect to home ....');
            setDisabled(false);
          })
          .catch(error => {
            setSpinning(false);
            setIsDeleteSuccessful(false);
            setDeleteResultMessage(error.toString());
            setDisabled(false);
          });
      } else {
        throw new Error("Can't delete Unknown IAC type");
      }
    }
  };

  return (
    <InfoCard title="Delete Provider">
      <CardContent>
        <Grid container spacing={2}>
          <Grid item zeroMinWidth xs={8}>
            <Typography sx={{ fontWeight: 'bold' }}>
              Delete this provider
            </Typography>
          </Grid>
          <Grid item zeroMinWidth xs={12}>
            <Typography noWrap>
              {/* <DeleteIcon fontSize="large" /> */}
              <Button
                variant="contained"
                style={{ backgroundColor: 'red' }}
                onClick={handleClickDelete}
                disabled={disabled}
              >
                Delete
              </Button>
            </Typography>
          </Grid>
          <Grid item zeroMinWidth xs={12}>
            {isDeleteSuccessful && deleteResultMessage && (
              <Alert
                id="alertGood"
                sx={{ mb: 2 }}
                severity="success"
                onClose={handleCloseAlert}
              >
                <AlertTitle>Success</AlertTitle>
                <strong>{entity.metadata.name}</strong> was successfully
                deleted!
                {!!deleteResultMessage && (
                  <>
                    <br />
                    <br />
                    {deleteResultMessage}
                  </>
                )}
              </Alert>
            )}
            {!isDeleteSuccessful && deleteResultMessage && (
              <Alert
                id="alertBad"
                sx={{ mb: 2 }}
                severity="error"
                onClose={handleCloseAlert}
              >
                <AlertTitle>Error</AlertTitle>
                Failed to delete <strong>{entity.metadata.name}</strong>.
                {!!deleteResultMessage && (
                  <>
                    <br />
                    <br />
                    {deleteResultMessage}
                  </>
                )}
              </Alert>
            )}
          </Grid>
        </Grid>
        <Backdrop
          sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }}
          open={spinning}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </CardContent>
    </InfoCard>
  );
};

export const DeleteProviderCard = () => {
  const { entity } = useEntity();
  const catalogApi = useApi(catalogApiRef);
  const input = { entity, catalogApi };
  return <DeleteProviderPanel input={input} />;
};
