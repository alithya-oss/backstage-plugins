import { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import MapIcon from '@material-ui/icons/MyLocation';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  SidebarSubmenu,
  SidebarSubmenuItem,
  useSidebarOpenState,
  Link,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import GroupIcon from '@material-ui/icons/People';

import MoneyIcon from '@material-ui/icons/MonetizationOn';
import CloudIcon from '@material-ui/icons/Cloud';
import {
  AWSLogoFull,
  AWSLogoIcon,
  CustomerLogoIcon,
  CustomerLogoFullLight,
} from '@aws/plugin-aws-apps-demo-for-backstage';
import { useApi, useApp, appThemeApiRef } from '@backstage/core-plugin-api';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

function getLogo(themeId: string) {
  switch (themeId) {
    case 'opaTheme':
      return [<AWSLogoFull />, <AWSLogoIcon />];
    case 'customerTheme':
      return [<CustomerLogoFullLight />, <CustomerLogoIcon />];
    default:
      return [<LogoFull />, <LogoIcon />];
  }
}

const SidebarLogo = () => {
  const appThemeApi = useApi(appThemeApiRef);
  const themeId = appThemeApi.getActiveThemeId();
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  const [fullLogo, iconLogo] = getLogo(themeId ?? '');

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? fullLogo : iconLogo}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {/* Global nav, not org-specific */}
        <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
        <MyGroupsSidebarItem
          singularTitle="My Group"
          pluralTitle="My Groups"
          icon={GroupIcon}
        />
        <SidebarDivider />
        <SidebarGroup label="AWS" icon={<MenuIcon />}>
          <SidebarItem icon={CloudIcon} text="AWS">
            <SidebarSubmenu title="AWS Catalog">
              <SidebarSubmenuItem
                title="Environments"
                to="aws-apps-search-page/environments?filters[kind]=awsenvironment"
                icon={useApp().getSystemIcon('kind:domain')}
              />
              <SidebarSubmenuItem
                title="Providers"
                to="aws-apps-search-page/providers?filters[kind]=awsenvironmentprovider"
                icon={useApp().getSystemIcon('kind:system')}
              />
              <SidebarSubmenuItem
                title="Apps"
                to="aws-apps-search-page/apps?filters[kind]=component"
                icon={useApp().getSystemIcon('kind:component')}
              />
              <SidebarSubmenuItem
                title="Resources"
                to="aws-apps-search-page/resources?filters[kind]=resource"
                icon={useApp().getSystemIcon('kind:resource')}
              />
            </SidebarSubmenu>
          </SidebarItem>
        </SidebarGroup>
        <SidebarDivider />
        <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
        <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
        <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
        {/* End global nav */}
        <SidebarDivider />
        <SidebarScrollWrapper>
          {/* Items in this group will be scrollable if they run out of space */}
          <SidebarItem icon={MapIcon} to="tech-radar" text="Tech Radar" />
          <SidebarItem
            icon={MoneyIcon}
            to="cost-insights"
            text="Cost Insights"
          />
        </SidebarScrollWrapper>
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <SidebarGroup
        label="Settings"
        icon={<UserSettingsSignInAvatar />}
        to="/settings"
      >
        <SidebarSettings />
      </SidebarGroup>
    </Sidebar>
    {children}
  </SidebarPage>
);
