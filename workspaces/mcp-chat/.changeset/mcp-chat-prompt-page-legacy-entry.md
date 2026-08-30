---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

The Assistant UI prompt page can now be mounted from an app on the old frontend
system, not only from the new one.

The plugin exports a second routable extension, `McpChatPromptPage`, on the
`prompt` route ref that already backed the new-frontend-system page. It renders
the same conversation surface, wrapped in the `Page`/`Content` shell that
`createRoutableExtension` requires, exactly as `McpChatPage` wraps the older chat
page.

```tsx
import { McpChatPromptPage } from '@alithya-oss/backstage-plugin-mcp-chat';

<Route path="/mcp-chat-prompt" element={<McpChatPromptPage />} />;
```

Additive: `McpChatPage` and the `root` route are unchanged, and an app that
mounts only the chat page behaves as before. The plugin's own dev app now
registers both pages, so `yarn start` exercises the prompt page too.
