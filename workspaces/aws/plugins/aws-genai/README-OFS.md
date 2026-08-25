## Installation (Old frontend system)

> [!IMPORTANT]
> The old frontend system is deprecated and support for it will be removed from
> this plugin in a future release. For the new frontend system, see
> [README.md](./README.md).

Install the frontend package in your Backstage app:

```shell
yarn workspace app add @alithya-oss/backstage-plugins-aws-genai
```

The UI is built with [Backstage UI](https://backstage.io/docs/backstage-ui/overview),
so make sure its stylesheet is imported once in `packages/app/src/index.tsx`:

```typescript
import '@backstage/ui/css/styles.css';
```

In `packages/app/src/App.tsx`, add a route for the chat UI page:

```tsx
import { AgentChatPage } from '@alithya-oss/backstage-plugins-aws-genai';

// ...

const routes = (
  <FlatRoutes>
    {/* ... */}
    <Route path="/assistant/:agentName" element={<AgentChatPage />} />
  </FlatRoutes>
);
```

Now edit `packages/app/src/components/Root/Root.tsx` to add a menu item:

```tsx
import { ChatIcon } from '@backstage/core-components';

// ...

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ... */}
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {/* ... */}
        <SidebarItem
          icon={ChatIcon}
          to="assistant/general"
          text="Chat Assistant"
        />
        {/* ... */}
      </SidebarGroup>
      {/* ... */}
    </Sidebar>
    {/* ... */}
  </SidebarPage>
);
```

The URL `assistant/general` means we're going to be using an agent named
`general`. See [the installation guide](../../docs/genai/installation.md#creating-your-first-agent)
for how to configure it.

### Deprecated exports

These named exports of `@alithya-oss/backstage-plugins-aws-genai` exist only for
the old frontend system and are all deprecated:

| Export           | Replacement                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `awsGenAiPlugin` | the package default export (a `createFrontendPlugin` plugin)             |
| `AgentChatPage`  | the `page:aws-genai` extension, contributed by the default export        |
| `AgentPageProps` | the `page:aws-genai` extension config (`title` is set by the app config) |

The default export is the new frontend system plugin, so the two systems can be
told apart at the import site:

```typescript
// New frontend system
import awsGenAiPlugin from '@alithya-oss/backstage-plugins-aws-genai';

// Old frontend system (deprecated)
import { awsGenAiPlugin } from '@alithya-oss/backstage-plugins-aws-genai';
```
