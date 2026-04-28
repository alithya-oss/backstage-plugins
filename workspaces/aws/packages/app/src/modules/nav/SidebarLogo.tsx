import {
  Link,
  sidebarConfig,
  useSidebarOpenState,
} from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import { useApi, appThemeApiRef } from '@backstage/core-plugin-api';
import { LogoFull } from './LogoFull';
import { LogoIcon } from './LogoIcon';
import {
  AWSLogoFull,
  AWSLogoIcon,
  CustomerLogoIcon,
  CustomerLogoFullLight,
} from '@aws/plugin-aws-apps-demo-for-backstage';

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

export const SidebarLogo = () => {
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
