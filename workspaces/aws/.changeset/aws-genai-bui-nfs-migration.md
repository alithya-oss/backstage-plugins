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

The plugin also ships a new frontend system entry point:

```typescript
import awsGenAiPlugin from '@alithya-oss/backstage-plugins-aws-genai/alpha';

export default createApp({ features: [awsGenAiPlugin] });
```

It contributes the agent API and a chat page mounted at `/aws-genai/:agentName`,
overridable through `app.extensions` config. The legacy `awsGenAiPlugin` and
`AgentChatPage` exports are unchanged, so existing apps keep working.

Apps must import the Backstage UI stylesheet once, for example in
`packages/app/src/index.tsx`:

```typescript
import '@backstage/ui/css/styles.css';
```
