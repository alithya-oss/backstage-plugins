Requirement references are to `specs/mcp-chat/prompt-page/spec.md`. All commands
run from `workspaces/mcp-chat` unless stated otherwise.

## 1. Entry point parity

Covers _Page availability alongside the existing chat page_.

- [x] 1.1 Add `src/components/PromptPage/PromptPage.tsx`, wrapping
      `PromptPageContent` in `<Page themeId="tool"><Content noPadding>` exactly as
      `ChatPage.tsx` wraps `ChatPageContent`, and export it from the directory's
      `index.ts`.
- [x] 1.2 Add `promptPageLoader` to `src/wiring.ts`, resolving `PromptPage`, and
      document it beside `chatPageLoader` as the shell-providing loader for the
      previous frontend system.
- [x] 1.3 Add the `McpChatPromptPage` routable extension to `src/plugin.ts` on
      `promptRouteRef`, add `prompt: promptRouteRef` to `mcpChatPlugin.routes`, and
      re-export the extension from `src/index.ts`. Leave `McpChatPage` and the
      `root` route untouched.
- [x] 1.4 Extend `src/plugin.test.ts` to assert both route refs are registered and
      that the new extension is a routable extension distinct from `McpChatPage` —
      scenario _The page is mounted from the previous frontend system_.
- [x] 1.5 Add a test for the shell proving it renders the page content inside the
      `Page` / `Content` chrome, with the content module mocked so the test does
      not stand up the Assistant UI runtime.

## 2. Dev app

Not covered by a requirement — `dev/` is not published.

- [x] 2.1 Register `McpChatPromptPage` as a second page in `dev/index.tsx`, on its
      own path, keeping the existing chat page entry unchanged.
- [x] 2.2 Verify the dev app builds and serves with both entries registered:
      `yarn backstage-cli package start --config ../../app-config.yaml` (a port
      override was used because 3000 was occupied) — Rspack compiled successfully
      and `/mcp-chat-prompt` served the app shell. A run against a live
      `mcp-chat-backend` was **not** exercised; the streaming path is unchanged by
      this change and stays covered by the prompt page's own tests.

## 3. Release artifacts

- [x] 3.1 Add a changeset for `@alithya-oss/backstage-plugin-mcp-chat`.
- [x] 3.2 Regenerate the API report: `rm -rf dist-types`, `yarn tsc`,
      `yarn build:api-reports:only`, then verify with
      `yarn build:api-reports:only --ci`.
- [x] 3.3 `CI=true yarn test plugins/mcp-chat`, `yarn tsc:full`, `yarn lint --fix`.
