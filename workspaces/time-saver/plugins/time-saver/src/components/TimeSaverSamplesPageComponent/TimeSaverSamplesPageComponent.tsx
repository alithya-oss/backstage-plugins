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
import React from 'react';
import { Typography, Grid } from '@material-ui/core';
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
  // AutocompleteTemplate,
  // BarChartTemplate,
  GaugeTemplate,
  // LineChartTemplate,
  // PieChartTemplate,
  // SelectorTemplate,
  TeamStatisticsBarChart,
  TemplateStatisticsBarChart,
  // TableTemplate,
  AllStatisticsBarChart,
  TimeSummaryPerTeamLineChart,
  TimeSummaryPerTemplateLineChart,
  DailyTimeSummaryPerTeamLineChart,
  DailyTimeSummaryPerTemplateLineChart,
  GroupDivisionStatisticsPieChart,
  TeamCountGauge,
  TemplateExecutionsCountGauge,
  TimeSavedGauge,
  StatisticsTable,
  TemplateNameAutocomplete,
  TemplateCountGauge,
  TeamSelector,
} from '@alithya-oss/backstage-plugin-time-saver-react';

export const TimeSaverSamplesPageComponent = () => {
  return (
    <Page themeId="tool">
      <Header title="Welcome to test!" subtitle="Optional subtitle">
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <ContentHeader title="Plugin title">
          <SupportButton>A description of your plugin goes here.</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <InfoCard title="Information card">
              <Typography variant="body1">
                All content should be wrapped in a card like this.
              </Typography>
            </InfoCard>
          </Grid>
          <Grid item>
            {/* <LineChartTemplate /> */}
            {/* <BarChartTemplate /> */}
            {/* <PieChartTemplate /> */}
            <GaugeTemplate />
            {/* <TableTemplate /> */}
            {/* <AutocompleteTemplate /> */}
            {/* <SelectorTemplate /> */}

            <AllStatisticsBarChart />
            <TeamStatisticsBarChart teamName="development_team" />
            <TemplateStatisticsBarChart templateName="template:default/example-code-testing-template" />

            <TimeSummaryPerTeamLineChart />
            <TimeSummaryPerTemplateLineChart />
            <DailyTimeSummaryPerTeamLineChart />
            <DailyTimeSummaryPerTemplateLineChart />

            <GroupDivisionStatisticsPieChart />

            <TeamCountGauge />
            <TemplateCountGauge />
            <TemplateExecutionsCountGauge />
            <TimeSavedGauge />
            <TimeSavedGauge divider={7} label="Time Saved [Weekly]" />

            <StatisticsTable />

            <TeamSelector onTeamChange={() => {}} />
            <TemplateNameAutocomplete onTemplateChange={() => {}} />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
