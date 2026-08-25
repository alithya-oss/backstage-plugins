---
'@alithya-oss/backstage-plugin-mcp-chat': minor
---

Added a second page to the `/alpha` entry point, mounted at `/mcp-chat-prompt` and bound to a new `prompt` route ref. It is the route the Assistant UI conversation surface is being built on; the existing `/mcp-chat` page, its route ref and its behaviour are unchanged, and adopters who do not mount the new page see no difference.

Narrowed the `react`, `react-dom` and `@types/react` peer ranges from `^17.0.0 || ^18.0.0` to `^18`.

**Migration:** none for React 18 adopters — Backstage 1.40 and later already require React 18. If you are still on React 17, stay on the previous version of this plugin: `@assistant-ui/react`, which the new page is built on, does not support React 17.
