# @alithya-oss/backstage-plugins-aws-genai

## 0.3.0

### Minor Changes

- 13d15c0: Migrated the GenAI frontend plugin to Backstage UI (BUI) and the new frontend system.

  The chat UI no longer depends on `@backstage/core-components`, `@material-ui/core` or
  `@material-ui/icons`. Layout, cards, buttons, dialog and accordion now come from
  `@backstage/ui`, styling moved from `makeStyles` to CSS modules using BUI design
  tokens, and icons come from `@remixicon/react`. Markdown rendering, previously
  provided by core components, is now a plugin-local component built on
  `react-markdown` with GitHub flavored markdown.

  The new frontend system plugin is the **default export** of the package entry point:

  ```typescript
  import awsGenAiPlugin from '@alithya-oss/backstage-plugins-aws-genai';

  export default createApp({ features: [awsGenAiPlugin] });
  ```

  It contributes the agent API and a chat page mounted at `/aws-genai/:agentName`,
  overridable through `app.extensions` config.

  Old frontend system support is unchanged and still available from the same entry
  point through its named exports, which are now marked deprecated:
  `awsGenAiPlugin`, `AgentChatPage` and `AgentPageProps`. Existing apps keep working
  without any change. See `README-OFS.md` for the old frontend system instructions.
  Support for the old frontend system will be removed in a future release.

  Apps must import the Backstage UI stylesheet once, for example in
  `packages/app/src/index.tsx`:

  ```typescript
  import '@backstage/ui/css/styles.css';
  ```

### Patch Changes

- 13d15c0: Load `eventsource-parser/stream` lazily in `AgentApiClient`.

  The module body of `eventsource-parser/stream` subclasses `TransformStream` while
  it evaluates, so a static import made that browser-only global a load-time
  requirement of the whole plugin. Any app installing the plugin then failed to
  render in a jsdom test with `ReferenceError: TransformStream is not defined`,
  even when it never opened the chat page, and had to polyfill the global in its
  own `setupTests`.

  The import now happens inside `chatSync`, where streaming actually starts. No
  API change and no polyfill needed by consumers.

## 0.2.1

### Patch Changes

- c6963c6: Moved the GenAI plugin documentation to `docs/genai` and made it available as a TechDocs site. The README now links to the full documentation set.

## 0.2.0

### Minor Changes

- 3a9791d: Introduce the AWS Generative AI plugins, a fork of the `@aws/genai-plugin-for-backstage` packages from [awslabs/backstage-plugins-for-aws](https://github.com/awslabs/backstage-plugins-for-aws/tree/main/plugins/genai).

  The plugins let you build conversational AI assistants inside Backstage, backed by configurable agents that can call Backstage backend plugins as tools. A LangGraph agent implementation supporting Amazon Bedrock, OpenAI and Ollama is included.

  Adopters coming from the upstream packages should update their imports:

  - `@aws/genai-plugin-for-backstage` → `@alithya-oss/backstage-plugins-aws-genai`
  - `@aws/genai-plugin-for-backstage-common` → `@alithya-oss/backstage-plugins-aws-genai-common`
  - `@aws/genai-plugin-for-backstage-node` → `@alithya-oss/backstage-plugins-aws-genai-node`
  - `@aws/genai-plugin-for-backstage-backend` → `@alithya-oss/backstage-plugins-aws-genai-backend`
  - `@aws/genai-plugin-langgraph-agent-for-backstage` → `@alithya-oss/backstage-plugins-aws-genai-agent-langgraph`

  Configuration keys, the `genai` plugin ID and the public API are unchanged.

### Patch Changes

- Updated dependencies [3a9791d]
  - @alithya-oss/backstage-plugins-aws-genai-common@0.2.0
