---
'@alithya-oss/backstage-plugins-aws-genai': minor
'@alithya-oss/backstage-plugins-aws-genai-common': minor
'@alithya-oss/backstage-plugins-aws-genai-node': minor
'@alithya-oss/backstage-plugins-aws-genai-backend': minor
'@alithya-oss/backstage-plugins-aws-genai-agent-langgraph': minor
---

Introduce the AWS Generative AI plugins, a fork of the `@aws/genai-plugin-for-backstage` packages from [awslabs/backstage-plugins-for-aws](https://github.com/awslabs/backstage-plugins-for-aws/tree/main/plugins/genai).

The plugins let you build conversational AI assistants inside Backstage, backed by configurable agents that can call Backstage backend plugins as tools. A LangGraph agent implementation supporting Amazon Bedrock, OpenAI and Ollama is included.

Adopters coming from the upstream packages should update their imports:

- `@aws/genai-plugin-for-backstage` → `@alithya-oss/backstage-plugins-aws-genai`
- `@aws/genai-plugin-for-backstage-common` → `@alithya-oss/backstage-plugins-aws-genai-common`
- `@aws/genai-plugin-for-backstage-node` → `@alithya-oss/backstage-plugins-aws-genai-node`
- `@aws/genai-plugin-for-backstage-backend` → `@alithya-oss/backstage-plugins-aws-genai-backend`
- `@aws/genai-plugin-langgraph-agent-for-backstage` → `@alithya-oss/backstage-plugins-aws-genai-agent-langgraph`

Configuration keys, the `genai` plugin ID and the public API are unchanged.
