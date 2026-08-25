---
'@alithya-oss/backstage-plugins-aws-genai': patch
---

Load `eventsource-parser/stream` lazily in `AgentApiClient`.

The module body of `eventsource-parser/stream` subclasses `TransformStream` while
it evaluates, so a static import made that browser-only global a load-time
requirement of the whole plugin. Any app installing the plugin then failed to
render in a jsdom test with `ReferenceError: TransformStream is not defined`,
even when it never opened the chat page, and had to polyfill the global in its
own `setupTests`.

The import now happens inside `chatSync`, where streaming actually starts. No
API change and no polyfill needed by consumers.
