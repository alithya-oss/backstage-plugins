# @alithya-oss/backstage-plugin-rag-ai-backend-retrieval-augmenter

## 1.0.9

### Patch Changes

- 2f8d114: Bump Backstage framework dependencies v1.39.0
- Updated dependencies [2f8d114]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.8

## 1.0.8

### Patch Changes

- f021c9d: Bump Backstage framework version 1.38.1
- Updated dependencies [f021c9d]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.7

## 1.0.7

### Patch Changes

- 2b44cae: Moved package @alithya-oss/plugin-_ to @alithya-oss/backstage-plugin-_
- Updated dependencies [2b44cae]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.6

## 1.0.6

### Patch Changes

- 1cc277e: Bump Backstage framework version 1.35.1
- Updated dependencies [1cc277e]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.5

## 1.0.5

### Patch Changes

- 3ba89eb: Bump Backstage framework version 1.35.0 and Langchain dependencies
- Updated dependencies [3ba89eb]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.4

## 1.0.4

### Patch Changes

- 58e7d6f: Bump framework version 1.32.5
- Updated dependencies [58e7d6f]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.3

## 1.0.3

### Patch Changes

- cdebf2e: Enforce release 2024-11-14
- Updated dependencies [cdebf2e]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.2

## 1.0.2

### Patch Changes

- a854796: Bump Backstage framework verison 1.32.5
- Updated dependencies [a854796]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.1

## 1.0.1

### Patch Changes

- c3db3c6: Fix issue with cleaning up old TechDocs vectors

## 1.0.0

### Major Changes

- cff627d: Migrated RAG AI plugin to new backend system.

### Patch Changes

- Updated dependencies [cff627d]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.2.0

## 0.3.6

### Patch Changes

- f040722: Fixed missing metadata from TechDocs embeddings

## 0.3.5

### Patch Changes

- c0ae442: Add `title` and `location` to metadata of TechDocs embeddings

## 0.3.4

### Patch Changes

- f5bab23: Upgraded the langchain dependencies of the rag-ai plugins
- Updated dependencies [f5bab23]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.4

## 0.3.3

### Patch Changes

- 9768baa: Added config parameter `ai.embeddings.concurrencyLimit` for limiting concurrency during creating TechDocs embeddings
- ed73691: Added source `all` for querying all sources simultaneously
- 9768baa: Renamed type `SplitterOptions` to `AugmentationOptions`
- Updated dependencies [ed73691]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.3

## 0.3.2

### Patch Changes

- bbf7702: Added support for TechDocs

## 0.3.1

### Patch Changes

- d02d5df: Upgrade to backstage 1.26.5
- Updated dependencies [d02d5df]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.2

## 0.3.0

### Minor Changes

- 2ac9477: Fix the 401 unauthorized error in searchClient for rag-ai-backend-retrieval-augmenter when using authMiddleware in backstage backend

## 0.2.1

### Patch Changes

- 7cd4bdf: version upgrade to 1.25.0
- Updated dependencies [7cd4bdf]
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.1

## 0.2.0

### Minor Changes

- 7fa2871: Fixed rag-ai compatiblity with API requests authentication and service-to-service auth enabled apps

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
  - @alithya-oss/backstage-plugin-rag-ai-node@0.1.0
