/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

import { createBackend } from '@backstage/backend-defaults';
import {
  gitlabPlugin,
  catalogPluginGitlabFillerProcessorModule,
} from '@immobiliarelabs/backstage-plugin-gitlab-backend';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-techdocs-backend'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider
backend.add(import('@backstage/plugin-auth-backend-module-gitlab-provider'));
backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-catalog-backend-module-gitlab'));
backend.add(import('@backstage/plugin-catalog-backend-module-gitlab-org'));
backend.add(import('@backstage/plugin-catalog-backend-module-github'));
backend.add(import('@backstage/plugin-catalog-backend-module-github-org'));
backend.add(import('./extensions/catalogAnnotateScmSlugEntityProcessor'));

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);
// backend.add(import('./extensions/harmonixSamplePermissionPolicy'));

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend'));

// amazon ecs plugin
backend.add(import('@alithya-oss/backstage-plugin-amazon-ecs-backend'));

// aws codebuild plugin
backend.add(import('@alithya-oss/backstage-plugin-aws-codebuild-backend'));

// aws codepipeline plugin
backend.add(import('@alithya-oss/backstage-plugin-aws-codepipeline-backend'));

// aws cost-insights plugin
backend.add(import('@alithya-oss/backstage-plugin-cost-insights-aws-backend'));

// scaffolder
backend.add(
  import('@alithya-oss/backstage-plugin-scaffolder-backend-module-aws-core'),
);

// awsapps
backend.add(import('@alithya-oss/backstage-plugin-aws-apps-backend'));
backend.add(
  import(
    '@alithya-oss/backstage-plugin-catalog-backend-module-aws-apps-entities-processor'
  ),
);
backend.add(
  import('@alithya-oss/backstage-plugin-scaffolder-backend-module-aws-apps'),
);

// scaffolder addons
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-gitlab'));
backend.add(import('@roadiehq/scaffolder-backend-module-utils'));

// gitlab third-party plugins
backend.add(gitlabPlugin);
backend.add(catalogPluginGitlabFillerProcessorModule);

backend.start();
