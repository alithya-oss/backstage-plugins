## Why

`add-mcp-chat-prompt-page` shipped the Assistant UI conversation page as a
`PageBlueprint` in `src/alpha.tsx` only. The spec it wrote requires the page to
be mountable beside the pre-existing chat page, but says nothing about _which_
entry point exposes it — and the plugin has two. `src/plugin.ts`, the entry an
app on the old frontend system consumes, still exports a single routable
extension, `McpChatPage`. There is no supported way to mount the prompt page
from such an app, even though every component it needs is already published.

The plugin's own dev app is the visible symptom: `dev/index.tsx` is built on
`createDevApp()` and can only register what `src/plugin.ts` exports, so
`yarn start` exercises the old chat page and nothing else. The page delivered by
the previous change cannot be run without standing up a full new-frontend-system
app.

Closing the gap in the plugin rather than in `dev/index.tsx` is what makes the
dev app worth trusting: it then mounts exactly what an adopter mounts.

## What Changes

- Add a `PromptPage` shell component wrapping `PromptPageContent` in the
  `Page` / `Content` pair that `createRoutableExtension` requires, mirroring
  what `ChatPage` already does for `ChatPageContent`.
- Add a `promptPageLoader` beside the existing `chatPageLoader` in
  `src/wiring.ts`, so both entry points keep loading their component through the
  same seam.
- Export a second routable extension, `McpChatPromptPage`, from `src/plugin.ts`,
  mounted on the existing `promptRouteRef`, and register that route ref in
  `mcpChatPlugin.routes` under `prompt`. `McpChatPage` and `rootRouteRef` are
  untouched.
- Register the new extension as a second page in the plugin's dev app, on its own
  path, leaving the existing dev page in place.

### Non-goals

- **No change to the page itself.** `PromptPageContent` and everything under
  `src/components/PromptPage` keep their current behaviour; the shell only adds
  the page chrome the old frontend system expects.
- **No change to the alpha entry point.** `mcpChatPromptPage` in `src/alpha.tsx`
  stays as it is, on the same path and route ref.
- **No deprecation of the chat page**, on either entry point. That decision still
  belongs to a later change.

## Capabilities

### Modified Capabilities

- `mcp-chat/prompt-page`: the page availability requirement is widened to state
  that the page is mountable from either of the plugin's entry points, not just
  the new frontend system one. No other requirement changes.

## Impact

**Package** — `workspaces/mcp-chat/plugins/mcp-chat`
(`@alithya-oss/backstage-plugin-mcp-chat`).

- `src/components/PromptPage/PromptPage.tsx`: new shell component, exported from
  the directory's `index.ts`.
- `src/wiring.ts`: new `promptPageLoader` export.
- `src/plugin.ts`: new `McpChatPromptPage` routable extension;
  `mcpChatPlugin.routes` gains `prompt`.
- `src/index.ts`: re-exports `McpChatPromptPage`.
- `dev/index.tsx`: second `addPage` entry. Not published — `files` is
  `dist`, `app-config.yaml`, `config.d.ts`.
- `report.api.md`: gains the new export. No existing entry changes.

**Adopters** — additive. An app that mounts only `McpChatPage` behaves exactly as
before; the new extension has to be mounted explicitly, on a route ref that
already existed. No dependency is added, so `yarn.lock` is untouched.

**Backend** — none. The page consumes the streaming endpoint delivered by
`add-mcp-chat-prompt-page`; nothing about it changes here.
