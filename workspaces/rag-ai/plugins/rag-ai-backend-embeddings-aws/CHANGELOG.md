# @alithya-oss/backstage-plugin-rag-ai-backend-embeddings-aws

## 1.0.7

### Patch Changes

- 2b44cae: Moved package @alithya-oss/plugin-_ to @alithya-oss/backstage-plugin-_
- Updated dependencies [2b44cae]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.7
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.6
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.6

## 1.0.6

### Patch Changes

- 1cc277e: Bump Backstage framework version 1.35.1
- Updated dependencies [1cc277e]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.6
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.5
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.5

## 1.0.5

### Patch Changes

- 3ba89eb: Bump Backstage framework version 1.35.0 and Langchain dependencies
- Updated dependencies [3ba89eb]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.5
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.4
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.4

## 1.0.4

### Patch Changes

- 58e7d6f: Bump framework version 1.32.5
- Updated dependencies [58e7d6f]
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.3
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.4
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.3

## 1.0.3

### Patch Changes

- cdebf2e: Enforce release 2024-11-14
- Updated dependencies [cdebf2e]
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.2
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.3
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.2

## 1.0.2

### Patch Changes

- a854796: Bump Backstage framework verison 1.32.5
- Updated dependencies [a854796]
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.1
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.2
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.1

## 1.0.1

### Patch Changes

- c3db3c6: Add max retries to embeddings to prevent forever loop in case of errors.
- Updated dependencies [c3db3c6]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.1

## 1.0.0

### Major Changes

- cff627d: Migrated RAG AI plugin to new backend system.

### Patch Changes

- Updated dependencies [cff627d]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@1.0.0
  - @alithya-oss/backstage-plugin-rag-ai-backend@2.0.0
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.0

## 0.2.6

### Patch Changes

- 19198fb: Updated @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter to 0.3.6

## 0.2.5

### Patch Changes

- f5bab23: Upgraded the langchain dependencies of the rag-ai plugins
- Updated dependencies [f5bab23]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.3.4
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.3.3
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.4

## 0.2.4

### Patch Changes

- 9768baa: Added config parameter `ai.embeddings.concurrencyLimit` for limiting concurrency during creating TechDocs embeddings
- 9768baa: Renamed type `SplitterOptions` to `AugmentationOptions`
- Updated dependencies [9768baa]
- Updated dependencies [ed73691]
- Updated dependencies [9768baa]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.3.3
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.3.2
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.3

## 0.2.3

### Patch Changes

- d02d5df: Upgrade to backstage 1.26.5
- Updated dependencies [d02d5df]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.3.1
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.3.1
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.2

## 0.2.2

### Patch Changes

- Updated dependencies [2ac9477]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.3.0
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.3.0

## 0.2.1

### Patch Changes

- 7cd4bdf: version upgrade to 1.25.0
- Updated dependencies [7cd4bdf]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.2.1
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.2.2
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.1

## 0.2.0

### Minor Changes

- 7fa2871: Fixed rag-ai compatiblity with API requests authentication and service-to-service auth enabled apps

### Patch Changes

- Updated dependencies [7fa2871]
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.2.0
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.2.0

## 0.1.0

### Minor Changes

- 7b468fa: Open source and release Roadie RAG AI Backstage Plugin

  This commit introduces the Roadie RAG AI plugin to Backstage. It adds constructs, types and interfaces to enable additional enhancement of RAG AI functionality of Backstage entities, tech-docs, API docs and Tech Insights fact data.

  - Includes the initial end-to-end configuration
  - Adds frontend modal display to handle query UI
  - Introduces and document AI assistant configurations
  - Adds support for vendor-specific embedding implementations for AWS Bedrock and OpenAI

  Contains necessary documentation for new users configure and start using the functionality as well as enhance the integration compatibility with the existing Backstage infrastructure.

### Patch Changes

- Updated dependencies [7b468fa]
  - @alithya-oss/backstage-plugin-rag-ai-backend@0.1.0
  - @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter@0.1.0
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.0
