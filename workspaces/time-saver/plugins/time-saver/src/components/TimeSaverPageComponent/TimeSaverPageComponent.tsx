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
import React, { useState } from 'react';
import { Grid, Tabs, Tab, Divider, Paper } from '@material-ui/core';
import {
  InfoCard,
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
  SupportButton,
} from '@backstage/core-components';
import {
  AllStatisticsBarChart,
  DailyTimeSummaryPerTeamLineChart,
  DailyTimeSummaryPerTemplateLineChart,
  GroupDivisionStatisticsPieChart,
  StatisticsTable,
  TeamCountGauge,
  TeamSelector,
  TeamStatisticsBarChart,
  TemplateCountGauge,
  TemplateExecutionsCountGauge,
  TemplateNameAutocomplete,
  TemplateStatisticsBarChart,
  TimeSavedGauge,
  TimeSummaryPerTeamLineChart,
  TimeSummaryPerTemplateLineChart,
} from '@alithya-oss/plugin-time-saver-react';

export const TimeSaverPageComponent = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleChange = (
    _event: unknown,
    _newValue: React.SetStateAction<number>,
  ) => {
    setSelectedTab(_newValue);
  };
  // TODO : Define / create _event type

  const handleTeamChange = (team: string) => {
    setSelectedTeam(team);
  };

  const handleTemplateChange = (templateUsed: string) => {
    setSelectedTemplate(templateUsed);
  };

  const handleClearTeam = () => {
    setSelectedTeam('');
  };

  const GaugesContainer = (
    <Grid
      container
      spacing={4}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Grid item xs={2}>
        <Paper elevation={0}>
          <TemplateCountGauge />
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper elevation={0}>
          <TimeSavedGauge label="Time Saved [hours]" />
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper elevation={0}>
          <TimeSavedGauge divider={8} label="Time Saved [days]" />
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper elevation={0}>
          <TeamCountGauge />
        </Paper>
      </Grid>
      <Grid item xs={2}>
        <Paper elevation={0}>
          <TemplateExecutionsCountGauge />
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Page themeId="tool">
      <Header
        title="Backstage TS plugin!"
        subtitle="Check saved time with TS plugin!"
      >
        <HeaderLabel label="Owner" value="Rackspace" />
        <HeaderLabel label="Lifecycle" value="experimental" />
      </Header>
      <Content>
        <ContentHeader title="Time Saver">
          <Tabs value={selectedTab} onChange={handleChange} centered={false}>
            <Tab label="All Stats" />
            <Tab label="By Team" />
            <Tab label="By Template" />
          </Tabs>
          <SupportButton>
            Time Saver plugin retrieves its config from template.metadata and
            groups it in a dedicated table, then it has a bunch of APIs for data
            queries
          </SupportButton>
        </ContentHeader>
        {/* <EmptyTimeSaver /> */}
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard title="Time statistics that you have saved using Backstage Templates">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {selectedTab === 0 && (
                    <Grid container spacing={2}>
                      {GaugesContainer}
                      <Divider variant="fullWidth" />
                      <Grid xs={6}>
                        <AllStatisticsBarChart />
                      </Grid>
                      <Grid xs={6}>
                        <StatisticsTable />
                      </Grid>
                      <Grid xs={6}>
                        <DailyTimeSummaryPerTeamLineChart />
                      </Grid>
                      <Grid xs={6}>
                        <TimeSummaryPerTeamLineChart />
                      </Grid>
                      <Grid xs={6}>
                        <GroupDivisionStatisticsPieChart />
                      </Grid>
                    </Grid>
                  )}
                  {selectedTab === 1 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Grid item xs={6}>
                          <TeamSelector
                            onTeamChange={handleTeamChange}
                            onClearButtonClick={handleClearTeam}
                          />
                          <Divider orientation="vertical" />
                        </Grid>
                      </Grid>
                      <Grid item xs={6}>
                        <TeamStatisticsBarChart teamName={selectedTeam} />
                      </Grid>{' '}
                      <Grid item xs={6}>
                        <StatisticsTable teamName={selectedTeam} />
                      </Grid>
                      <Grid item xs={6}>
                        <DailyTimeSummaryPerTeamLineChart
                          teamName={selectedTeam}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TimeSummaryPerTeamLineChart teamName={selectedTeam} />
                      </Grid>
                    </Grid>
                  )}
                  {selectedTab === 2 && (
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Grid item xs={6}>
                          <TemplateNameAutocomplete
                            onTemplateChange={handleTemplateChange}
                          />
                        </Grid>
                      </Grid>
                      <Grid item xs={6}>
                        <TemplateStatisticsBarChart
                          templateName={selectedTemplate}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <StatisticsTable templateName={selectedTemplate} />
                      </Grid>
                      <Grid item xs={6}>
                        <DailyTimeSummaryPerTemplateLineChart
                          templateName={selectedTemplate}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TimeSummaryPerTemplateLineChart
                          templateName={selectedTemplate}
                        />
                      </Grid>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </InfoCard>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
