# Installation

NOTE: This guide will use the provided LangGraph implementation. To implement your own agent type see [Agent implementation](agent-types.md).

This guide assumes that you are familiar with the general [Getting Started](https://backstage.io/docs/getting-started/) documentation and assumes you have an existing Backstage application.

## Backend package

Install the backend package in your Backstage app:

```shell
yarn workspace backend add @alithya-oss/backstage-plugins-aws-genai-backend @alithya-oss/backstage-plugins-aws-genai-agent-langgraph
```

Add the plugin to the `packages/backend/src/index.ts`:

```typescript
const backend = createBackend();
// ...
backend.add(import('@alithya-oss/backstage-plugins-aws-genai-backend'));
backend.add(import('@alithya-oss/backstage-plugins-aws-genai-agent-langgraph'));
// ...
backend.start();
```

Verify that the backend plugin is running in your Backstage app. You should receive `{"status":"ok"}` when accessing this URL:

`http://<your backstage app>/api/aws-genai/health`.

## Frontend package

Install the frontend package in your Backstage app:

```shell
yarn workspace app add @alithya-oss/backstage-plugins-aws-genai
```

Edit `packages/app/src/App.tsx` to add a route for the chat UI page:

```typescript
import { AgentChatPage } from '@alithya-oss/backstage-plugins-aws-genai';

{
  /* ... */
}

const routes = (
  <FlatRoutes>
    /* ... */
    <Route path="/assistant/:agentName" element={<AgentChatPage />} />
  </FlatRoutes>
);
```

Now edit `packages/app/src/components/Root/Root.tsx` to add a menu item:

```tsx
import { ChatIcon } from '@backstage/core-components';

{
  /* ... */
}
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

The URL `assistant/general` means we're going to be using an agent named `general`, which we'll configure below.

## Creating your first agent

This plugin is built around the notion of creating one or more "agents" that can be invoked. These are defined by configuration, so lets configure our first agent.

Add this to your Backstage configuration file (for example `app-config.yaml`):

```yaml
genai:
  agents:
    general: # This matches the URL in the frontend
      description: General chat assistant
      prompt: >
        You are an expert in platform engineering and answer questions in a succinct and easy to understand manner.

        Answers should always be well-structured and use well-formed Markdown.

        The current user is {username} and you can provide that information if asked.
      langgraph:
        messagesMaxTokens: 150000 # Set based on context of chosen model, prune message history based on number of tokens
        # Use appropriate snippet for your model provider
        bedrock:
          modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0'
          region: us-west-2
        # openai:
        #   apiKey: ${OPENAI_API_KEY}
```

See the [LangGraph agent](langgraph-agent.md) documentation for the full configuration reference.

Start the Backstage application:

```shell
yarn start
```

Access the application in your browser and select the "Chat Assistant" option in the menu. Ask a general question like "What is Terraform?".

## Next steps

Give the agent access to your Backstage data by [registering actions](actions-and-tools.md).
