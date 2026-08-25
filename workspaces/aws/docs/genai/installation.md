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

The UI is built with [Backstage UI](https://backstage.io/docs/backstage-ui/overview),
so make sure its stylesheet is imported once in `packages/app/src/index.tsx`:

```typescript
import '@backstage/ui/css/styles.css';
```

Add the plugin to `packages/app/src/App.tsx`:

```typescript
import awsGenAiPlugin from '@alithya-oss/backstage-plugins-aws-genai';

export default createApp({
  features: [awsGenAiPlugin],
});
```

The chat page is mounted at `/aws-genai/:agentName`. Override the path from
`app-config.yaml` if you prefer another one:

```yaml
app:
  extensions:
    - page:aws-genai:
        config:
          path: /assistant/:agentName
```

The plugin does not contribute a sidebar entry: the route carries an
`:agentName` parameter, so only your app knows which agent to link to. Add a
link to a concrete agent path from your app's nav content, for example:

```tsx
<SidebarItem icon={ChatIcon} to="aws-genai/general" text="Chat Assistant" />
```

The path segment `general` is the name of the agent we configure below.

### Old frontend system

The plugin still works in apps on the old frontend system through its deprecated
named exports. See
[README-OFS.md](https://github.com/alithya-oss/backstage-plugins/blob/main/workspaces/aws/plugins/aws-genai/README-OFS.md)
for those instructions. Support for the old frontend system will be removed in a
future release.

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
