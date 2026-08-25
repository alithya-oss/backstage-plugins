---
'@alithya-oss/backstage-plugins-aws-genai': minor
---

Migrated the GenAI frontend plugin to Backstage UI (BUI) and the new frontend system.

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
