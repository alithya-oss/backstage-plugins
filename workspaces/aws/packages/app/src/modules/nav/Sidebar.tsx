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
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
  SidebarSubmenu,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
import MenuIcon from '@material-ui/icons/Menu';
import {
  RiMoneyDollarCircleLine,
  RiPuzzleLine,
  RiCloudLine,
  RiSeoLine,
  RiRobot2Line,
} from '@remixicon/react';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import GroupIcon from '@material-ui/icons/People';
import { useApp } from '@backstage/core-plugin-api';

const CloudIcon = () => <RiCloudLine size={20} />;
const PuzzleIcon = () => <RiPuzzleLine size={20} />;
const MoneyIcon = () => <RiMoneyDollarCircleLine size={20} />;
const SearchIcon = () => <RiSeoLine size={20} />;
const ChatIcon = () => <RiRobot2Line size={20} />;

const AwsCatalogSubmenu = () => {
  const app = useApp();
  return (
    <SidebarItem icon={CloudIcon} text="AWS">
      <SidebarSubmenu title="AWS Catalog">
        <SidebarSubmenuItem
          title="Environments"
          to="aws-apps-search-page/environments?filters[kind]=awsenvironment"
          icon={app.getSystemIcon('kind:domain')}
        />
        <SidebarSubmenuItem
          title="Providers"
          to="aws-apps-search-page/providers?filters[kind]=awsenvironmentprovider"
          icon={app.getSystemIcon('kind:system')}
        />
        <SidebarSubmenuItem
          title="Apps"
          to="aws-apps-search-page/apps?filters[kind]=component"
          icon={app.getSystemIcon('kind:component')}
        />
        <SidebarSubmenuItem
          title="Resources"
          to="aws-apps-search-page/resources?filters[kind]=resource"
          icon={app.getSystemIcon('kind:resource')}
        />
      </SidebarSubmenu>
    </SidebarItem>
  );
};

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item => (
        <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
      ));

      // Suppress items rendered via dedicated UI elements
      nav.take('page:search'); // Using search modal instead
      nav.take('page:cost-insights'); // Removed from sidebar
      nav.take('page:graphiql'); // Removed from sidebar
      nav.take('page:kubernetes'); // Removed from sidebar
      nav.take('page:catalog-graph'); // Removed from sidebar
      nav.take('page:catalog-import');
      nav.take('page:api-docs');
      // Mounted per agent (/aws-genai/:agentName), so the inferred nav item
      // cannot produce a usable link. Rendered below as a link to the `general`
      // agent configured under `genai.agents`.
      nav.take('page:aws-genai');

      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {nav.take('page:catalog')}
            {nav.take('page:scaffolder')}
            <MyGroupsSidebarItem
              singularTitle="My Group"
              pluralTitle="My Groups"
              icon={GroupIcon}
            />
            <SidebarDivider />
            <AwsCatalogSubmenu />
            <SidebarDivider />
            <SidebarItem text="APIs" icon={PuzzleIcon} to="api-docs">
              {/* {nav.take('page:api-docs')} */}
            </SidebarItem>
            {nav.take('page:techdocs')}
            <SidebarDivider />
            <SidebarScrollWrapper>
              <SidebarItem
                icon={ChatIcon}
                to="aws-genai/general"
                text="Chat Assistant"
              />
              <SidebarItem
                icon={MoneyIcon}
                to="cost-insights"
                text="Cost Insights"
              />
              {nav.rest({ sortBy: 'title' })}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            {nav.take('page:user-settings')}
          </SidebarGroup>
        </Sidebar>
      );
    },
  },
});
