// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ReactElement, Children, ReactNode } from 'react';
import { OPAAppData } from '../../types';

export const AboutField = ({
  label,
  value,
  gridSizes,
  children,
}: {
  label: string;
  value?: string | ReactElement;
  gridSizes?: Record<string, number>;
  children?: ReactNode;
}) => {
  // Content is either children or a string prop `value`
  const content = Children.count(children) ? (
    children
  ) : (
    <Typography variant="body2">{value || `unknown`}</Typography>
  );
  return (
    <Grid item {...gridSizes}>
      <Typography variant="subtitle2">{label}</Typography>
      {content}
    </Grid>
  );
};

export const AppView = ({ appData }: { appData: OPAAppData }): ReactElement => {
  Object.keys(appData).forEach(key => {
    const newKey = key.replace('opa/', '');
    appData[newKey] = appData[key];
    delete appData[key];
  });
  const details = appData;

  return (
    <div>
      {appData && (
        <>
          <Card>
            <CardHeader title={<Typography variant="h5">OPA App</Typography>} />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography
                    variant="subtitle1"
                    style={{
                      paddingTop: 24,
                      color: '#645B59',
                      fontWeight: 'bold',
                    }}
                  >
                    General Info
                  </Typography>
                  <Grid container>
                    <Grid item>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        repo url
                      </Typography>
                      <Typography>
                        <IconButton>
                          <FileCopyIcon />
                        </IconButton>
                        {details?.repourl}
                      </Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        repo token
                      </Typography>
                      <Typography>
                        <IconButton>
                          <FileCopyIcon />
                        </IconButton>
                        {details?.repotoken}
                      </Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Public
                      </Typography>
                      <Typography
                        style={
                          details?.public
                            ? { color: 'Green' }
                            : { color: 'Red' }
                        }
                      >
                        {details?.public ? 'Yes' : 'No'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Divider
                  orientation="vertical"
                  flexItem
                  style={{ marginRight: '-1px', marginTop: 16 }}
                />
                <Grid item xs={4}>
                  <Typography
                    variant="subtitle1"
                    style={{
                      paddingTop: 24,
                      color: '#645B59',
                      fontWeight: 'bold',
                    }}
                  >
                    Deployment Info
                  </Typography>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Template
                      </Typography>
                      <Typography style={{ marginTop: 8 }}>
                        {details?.template}
                      </Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Account
                      </Typography>
                      <Typography>
                        <IconButton>
                          <FileCopyIcon />
                        </IconButton>
                        {details?.account}
                      </Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Region
                      </Typography>
                      <Typography style={{ marginTop: 8 }}>
                        {details?.region}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Version
                      </Typography>
                      <Typography style={{ marginTop: 8 }}>1.0.0</Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Environment
                      </Typography>
                      <Typography style={{ marginTop: 8 }}>
                        {details?.environment}
                      </Typography>
                      <Typography style={{ paddingTop: 24, color: '#645B59' }}>
                        Owner
                      </Typography>
                      <Typography style={{ marginTop: 8 }}>
                        {details?.owner}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
