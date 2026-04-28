---
inclusion: manual
---

# Backstage App Migration to the New Frontend System

Guides migration of a Backstage `packages/app` from the legacy frontend system to the new extension-based architecture. Based on the official migration guide at https://backstage.io/docs/frontend-system/building-apps/migrating/ and the reference app template at https://github.com/backstage/backstage/tree/master/packages/create-app/templates/default-app.

## Prerequisites

- A `backstage.json` file at the git repository root with the Backstage version: `{"version": "1.50.2"}`. The yarn backstage plugin resolves `backstage:^` specifiers from this file. Without it, `yarn add` fails with `Valid version string not found in backstage.json`.
- Access to run `yarn` commands in the workspace.

## Target State (Reference App Pattern)

The fully migrated app is minimal. All plugins are auto-discovered via `app.packages` config. Only the catalog plugin (which needs explicit entity page configuration) and the nav module (custom sidebar) are manually installed.

### File structure

```
packages/app/src/
├── App.tsx              # 6 lines — createApp + features
├── App.test.tsx         # Renders App.createRoot()
├── index.tsx            # Renders App.createRoot()
├── setupTests.ts
└── modules/
    └── nav/
        ├── index.ts         # createFrontendModule exporting SidebarContent
        ├── Sidebar.tsx      # NavContentBlueprint with sidebar layout
        ├── SidebarLogo.tsx  # Logo component
        ├── LogoFull.tsx     # Full logo SVG
        └── LogoIcon.tsx     # Icon logo SVG
```

### `App.tsx`

```tsx
import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';

export default createApp({
  features: [catalogPlugin, navModule],
});
```

### `index.tsx`

```tsx
import '@backstage/cli/asset-types';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@backstage/ui/css/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());
```

### `App.test.tsx`

```tsx
import { render, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render', async () => {
    process.env = {
      NODE_ENV: 'test',
      APP_CONFIG: [
        {
          data: {
            app: { title: 'Test' },
            backend: { baseUrl: 'http://localhost:7007' },
            techdocs: {
              storageUrl: 'http://localhost:7007/api/techdocs/static/docs',
            },
          },
          context: 'test',
        },
      ] as any,
    };
    const rendered = render(App.createRoot());
    await waitFor(() => {
      expect(rendered.baseElement).toBeInTheDocument();
    });
  });
});
```

### `app-config.yaml` (app section)

```yaml
app:
  title: My Backstage App
  baseUrl: http://localhost:3000
  packages: all
  extensions:
    # Disable auto-generated nav items for plugins rendered manually in Sidebar.tsx
    - nav-item:search: false
    - nav-item:user-settings: false
    - nav-item:catalog: false
    - nav-item:scaffolder: false
    - nav-item:api-docs: false
    - nav-item:techdocs: false
```

If a third-party plugin conflicts with auto-discovery, exclude it from package scanning:

```yaml
app:
  packages:
    include: all
    exclude:
      - '@immobiliarelabs/backstage-plugin-gitlab'
```

## Nav Module

### `modules/nav/index.ts`

```ts
import { createFrontendModule } from '@backstage/frontend-plugin-api';
import { SidebarContent } from './Sidebar';

export const navModule = createFrontendModule({
  pluginId: 'app',
  extensions: [SidebarContent],
});
```

### `modules/nav/Sidebar.tsx`

The `NavContentBlueprint` receives `navItems` with:

- `navItems.withComponent(renderFn)` — defines how each nav item renders
- `nav.take('page:plugin-id')` — renders a specific plugin's nav item at a fixed position, removes it from the pool
- `nav.rest({ sortBy: 'title' })` — renders all remaining items alphabetically
- Call `nav.take('page:search')` without using the return value to suppress it from `rest()`

```tsx
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item => (
        <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
      ));

      nav.take('page:search'); // Using search modal instead

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
            <SidebarDivider />
            <SidebarScrollWrapper>
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
```

### `modules/nav/SidebarLogo.tsx`

```tsx
import {
  Link,
  sidebarConfig,
  useSidebarOpenState,
} from '@backstage/core-components';
import { makeStyles } from '@material-ui/core';
import { LogoFull } from './LogoFull';
import { LogoIcon } from './LogoIcon';

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

export const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();
  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};
```

### Custom sidebar items (submenus, groups)

Custom static items like submenus are rendered as regular JSX inside the `NavContentBlueprint` component — they're not managed by `navItems`:

```tsx
import { SidebarSubmenu, SidebarSubmenuItem } from '@backstage/core-components';
import CloudIcon from '@material-ui/icons/Cloud';
import { useApp } from '@backstage/core-plugin-api';

// Inside the SidebarContent component:
<SidebarItem icon={CloudIcon} text="AWS">
  <SidebarSubmenu title="AWS Catalog">
    <SidebarSubmenuItem
      title="Environments"
      to="aws-apps-search-page/environments"
      icon={useApp().getSystemIcon('kind:domain')}
    />
  </SidebarSubmenu>
</SidebarItem>;
```

## Migration Steps

### Step 1: Install dependencies

```bash
yarn --cwd packages/app add @backstage/frontend-defaults @backstage/frontend-plugin-api @backstage/plugin-app-react
```

### Step 2: Create `modules/nav/`

Create the nav module files (index.ts, Sidebar.tsx, SidebarLogo.tsx). Move LogoFull.tsx and LogoIcon.tsx from `components/Root/` to `modules/nav/`, converting default exports to named exports.

### Step 3: Rewrite `App.tsx`

Replace the entire file with the minimal target state pattern. This removes:

- All `convertLegacyAppOptions` / `convertLegacyAppRoot` compat helpers
- All `FlatRoutes` / `Route` definitions
- All `bindRoutes` configuration
- All legacy imports (apis, entityPage, searchPage, Root, AlertDisplay, OAuthRequestDialog, AppRouter)

### Step 4: Update `index.tsx` and `App.test.tsx`

Use `App.createRoot()` pattern (not `app` as a variable — `createApp` returns the app object, `App.createRoot()` returns the React element).

### Step 5: Update `app-config.yaml`

Add `app.packages: all` and disable nav items for manually rendered sidebar entries.

### Step 6: Clean up

Delete:

- `src/apis.ts`
- `src/components/Root/` (entire directory)
- `src/components/catalog/EntityPage.tsx`
- `src/components/search/SearchPage.tsx`
- `src/components/` (if empty)

Remove unused dependencies from `package.json`:

- `@backstage/app-defaults`
- `@backstage/core-app-api`
- `@backstage/core-compat-api`
- `@backstage/catalog-model`
- `@backstage/integration-react`
- `@backstage/plugin-catalog-common`
- `@backstage/plugin-catalog-react`
- `@backstage/plugin-permission-react`
- `@backstage/plugin-search-react`
- `@backstage/plugin-techdocs-react`
- `@backstage/theme`
- `history`
- `react-use`

Keep all plugin packages — they're still needed for `app.packages: all` auto-discovery.

## Common Pitfalls

### API_FACTORY_CONFLICT errors

The new system auto-discovers API factories from installed plugins. If `apis.ts` registers an API that a plugin already provides (e.g., `entityPresentationApiRef` from catalog), you get:

```
API_FACTORY_CONFLICT: API 'plugin.catalog.entity-presentation' is already provided by plugin 'catalog'
```

**Fix**: Delete `apis.ts` entirely. In the fully migrated state, there's no `apis.ts` — plugins provide their own APIs.

### Third-party plugin conflicts with `app.packages: all`

When a third-party plugin (e.g., `@immobiliarelabs/backstage-plugin-gitlab`) ships with new frontend system support, `app.packages: all` auto-discovers it. If the same plugin is also referenced in legacy compat code, both versions try to register the same API:

```
API_FACTORY_CONFLICT: API 'plugin.gitlabci.service' is already provided by plugin 'gitlab', cannot also be provided by 'Gitlab'
```

**Fix**: Exclude the conflicting package from auto-discovery:

```yaml
app:
  packages:
    include: all
    exclude:
      - '@immobiliarelabs/backstage-plugin-gitlab'
```

Note: The `plugin:gitlab: false` extension disable syntax may not work for third-party plugins with non-standard plugin IDs. The `packages.exclude` approach is more reliable.

### Missing `backstage.json`

```
Valid version string not found in backstage.json
```

**Fix**: Create at the git repo root: `{"version": "1.50.2"}`

### Duplicate nav items

If sidebar items appear twice, it means both `nav.take('page:...')` and the auto-generated nav item extension are rendering. Disable the auto-generated one in config:

```yaml
app:
  extensions:
    - nav-item:catalog: false
```

### `RequirePermission` wrapping routes

Not applicable in the fully migrated state since there are no `<FlatRoutes>`. Permission checks should be handled within plugin pages themselves.

## Optional: Hybrid Mode (Intermediate Step)

If you can't migrate everything at once, use compat helpers as an intermediate step. Install `@backstage/core-compat-api` and use `convertLegacyAppOptions` + `convertLegacyAppRoot` to wrap legacy code while gradually migrating. See https://backstage.io/docs/frontend-system/building-apps/migrating/ for details.

The key risk with hybrid mode is `API_FACTORY_CONFLICT` errors from plugins being loaded both through auto-discovery and the compat layer. Either disable `app.packages` or exclude conflicting packages until fully migrated.

## Optional Extensions

### Custom themes via `ThemeBlueprint`

```tsx
import { ThemeBlueprint } from '@backstage/plugin-app-react';

const customTheme = ThemeBlueprint.make({
  name: 'custom-light',
  params: {
    theme: {
      id: 'custom-light',
      title: 'Light',
      variant: 'light',
      icon: <FlareIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={themes.light} children={children} />
      ),
    },
  },
});
```

### Custom sign-in page via `SignInPageBlueprint`

```tsx
import { SignInPageBlueprint } from '@backstage/plugin-app-react';

const signInPage = SignInPageBlueprint.make({
  params: {
    loader: async () => props => <SignInPage {...props} providers={[...]} />,
  },
});
```

### Custom icons via `IconBundleBlueprint`

```tsx
import { IconBundleBlueprint } from '@backstage/plugin-app-react';

const customIcons = IconBundleBlueprint.make({
  name: 'custom-icons',
  params: {
    icons: {
      'kind:awsenvironment': DomainIcon,
      'kind:awsenvironmentprovider': SystemIcon,
    },
  },
});
```

### Bundling extensions into a module

```tsx
import { createFrontendModule } from '@backstage/frontend-plugin-api';

const appModule = createFrontendModule({
  pluginId: 'app',
  extensions: [customTheme, signInPage, customIcons],
});

export default createApp({
  features: [catalogPlugin, navModule, appModule],
});
```

## Verification Checklist

- [ ] `backstage.json` exists at repo root
- [ ] App starts without `API_FACTORY_CONFLICT` errors
- [ ] All plugin pages render (catalog, scaffolder, techdocs, api-docs, search, settings)
- [ ] Sidebar navigation works with `nav.take()` and `nav.rest()`
- [ ] No duplicate nav items
- [ ] Entity pages render correctly
- [ ] Sign-in page works
- [ ] `App.test.tsx` passes
- [ ] Type check passes (`tsc --noEmit`)
- [ ] Legacy `components/` directory removed
- [ ] `apis.ts` removed
- [ ] Unused dependencies removed from `package.json`
