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

import { AWSEnvironmentProviderRecord } from '@alithya-oss/backstage-plugin-aws-apps-common';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  makeStyles,
} from '@material-ui/core';
import Close from '@material-ui/icons/Close';
import { useEffect, useState } from 'react';
// Declare styles to use in the components
const useStyles = makeStyles(theme => ({
  container: {
    'min-width': 500,
    'min-height': 150,
  },
  resourceTitle: {
    'font-weight': 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  empty: {
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center',
  },
}));

/**
 *
 * @param isOpen Boolean describing whether the dialog is displayed (open) or not (closed)
 * @param closeDialogHandler the handler callback when the dialog is closed
 * @param resource The AWS resource type to display its details.  Only SSM Parameters and SecretsManager secrets are supported
 * @returns
 */
export const AwsEnvironmentProviderSelectorDialog = ({
  isOpen,
  closeDialogHandler,
  selectHandler,
  providersInput,
}: {
  isOpen: boolean;
  closeDialogHandler: () => void;
  selectHandler: (item: AWSEnvironmentProviderRecord) => void;
  providersInput: AWSEnvironmentProviderRecord[];
}) => {
  const classes = useStyles();
  const [selectedProvider, setSelectedProvider] =
    useState<AWSEnvironmentProviderRecord>();

  const handleChangeSelectedProvider = (
    event: React.ChangeEvent<{ name?: string; value: unknown }>,
  ) => {
    const newProvider = event.target.value as string;
    const matchingProviders = providersInput.filter(providerRecord => {
      return newProvider === `${providerRecord.prefix}:${providerRecord.name}`;
    });

    if (matchingProviders.length !== 1) {
      // console.error(`Failed to find provider matching ${newProvider}`);
    } else {
      setSelectedProvider(matchingProviders[0]);
    }
  };

  const localSelectHandler = () => {
    // if there's a selected value - relay the item to the external caller
    if (selectedProvider) {
      selectHandler(selectedProvider);
    }
    closeDialogHandler();
  };

  if (!selectedProvider && providersInput.length > 0) {
    setSelectedProvider(providersInput[0]);
  }

  const selectorProviders = providersInput.map(p => {
    const key = `${p.prefix}:${p.name}`;
    const title = `${p.prefix}:${p.name}`;
    return (
      <MenuItem key={key} value={key}>
        {title}
      </MenuItem>
    );
  });

  const getSelectedProvider = () => {
    if (selectedProvider) {
      return `${selectedProvider?.prefix}:${selectedProvider?.name}`;
    }
    return undefined;
  };

  useEffect(() => {}, []);

  return (
    <Dialog
      className={classes.container}
      open={isOpen}
      onClose={closeDialogHandler}
      disableEnforceFocus
    >
      <DialogTitle id="dialog-title">
        Available Providers
        <IconButton
          className={classes.closeButton}
          onClick={closeDialogHandler}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Grid container>
          <FormControl fullWidth style={{ margin: 16 }}>
            <InputLabel id="lbl-select-aws-environment">Providers</InputLabel>
            <Select
              style={{ width: 300 }}
              labelId="select-aws-environment-provider"
              id="select-aws-environment-provider"
              value={getSelectedProvider()}
              label="Environments"
              onChange={handleChangeSelectedProvider}
            >
              {selectorProviders}
            </Select>
          </FormControl>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={localSelectHandler}>
          Select
        </Button>
        <Button color="primary" onClick={closeDialogHandler}>
          Dismiss
        </Button>
      </DialogActions>
    </Dialog>
  );
};
