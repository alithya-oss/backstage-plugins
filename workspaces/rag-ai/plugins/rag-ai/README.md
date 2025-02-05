# Roadie RAG AI Frontend plugin for Backstage

This plugin is the frontend for RAG AI Backstage plugin. You can see the corresponding backend plugin in [here](/plugins/backend/rag-ai-backend/README.md).

![docs/petstore-rag-openapi-example.gif](docs/petstore-rag-openapi-example.gif)

## Getting started

The plugin exposes a single Modal React component which can be triggered on the application UI by pressing `ctrl+,` (control + comma).
![docs/empty-modal.png](docs/empty-modal.png)

You can ask the plugin information about your catalog and request assistance on how to better interact with the catalog entities that have been configured to your system. The plugin provides functionality to call the RAG AI backend, which enhances your queries with additional context and requests responses from configured LLMs to provide answers based on that context.

![docs/simple-q-a.png](docs/simple-q-a.png)

Depending on how you implement your Embeddings providers and retrieval functionality, you can use the LLM, for example, to construct specific code samples from your Catalog Entity API endpoints, while using the wider knowledge of specific best practices from various programming languages and frameworks.

![docs/api-spec-query.png](docs/api-spec-query.png)

## Configuration

To configure the frontend plugin, you need to do two things:

- Create an API client for the frontend plugin
- Add the exposed UI element into the application

### Adding the UI components into the application

The plugin exposes a single UI component which is used to communicate with the application Backend. You can register this

App.tsx

```tsx

// packages/app/src/App.tsx
import { RagModal } from '@alithya-oss/backstage-plugin-rag-ai';

...
const App = () => (
  <AppProvider>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <RagModal />
      <Root>{routes}</Root>
    </AppRouter>
  </AppProvider>
);
```

You can also choose to use the `SidebarRagModal` component instead. In addition to using a hotkey, this will allow you to open the modal from the sidebar as well.

```tsx
// packages/app/src/components/Root/Root.tsx
import { SidebarRagModal } from '@alithya-oss/backstage-plugin-rag-ai';
...
export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      <SidebarLogo />
      <SidebarSearch />
      <SidebarRagModal />
      ...
    </Sidebar>
    {children}
  </SidebarPage>
);
```
