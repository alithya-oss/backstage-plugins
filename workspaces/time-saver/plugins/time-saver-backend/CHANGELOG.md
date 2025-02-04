# @alithya-oss/plugin-time-saver-backend

## 3.0.4

### Patch Changes

- 1cc277e: Bump Backstage framework version 1.35.1
- Updated dependencies [1cc277e]
  - @alithya-oss/plugin-time-saver-common@0.5.4

## 3.0.3

### Patch Changes

- 58e7d6f: Bump framwork version 1.32.5
- Updated dependencies [58e7d6f]
  - @alithya-oss/plugin-time-saver-common@0.5.3

## 3.0.2

### Patch Changes

- cdebf2e: Enforce release 2024-11-14
- Updated dependencies [cdebf2e]
  - @alithya-oss/plugin-time-saver-common@0.5.2

## 3.0.1

### Patch Changes

- a854796: Restated Time Saver react library and fixed workspace in order to continue to be capable of generating api-reports. The workspace has also been updated with Backstage version 1.32.5, which provides knip reports holding information about unused packages.
- Updated dependencies [a854796]
  - @alithya-oss/plugin-time-saver-common@0.5.1

## 3.0.0

### Major Changes

- cc89fa6: Upgraded time saver DB client to use knex functions to build queries. Previously, raw queries were used that were only compatible with PostgreSQL. Users are now able to use other databases and even deploy locally using sqlite.

### Minor Changes

- cc89fa6: Deleted deprecated files created for legacy backend plugins
- cc89fa6: Updated all plugin classes to use Discovery Service and Lifecycle Service as requested by the Backstage Community

### Patch Changes

- Updated dependencies [cc89fa6]
  - @alithya-oss/plugin-time-saver-common@0.5.0

## 2.5.0

### Minor Changes

- Replaced native date functions for luxon.
- Migrated time-saver workspace plugins to Alithya's Backstage community plugins repository.

## 2.4.0

### Minor Changes

- Provided dependencies upgrade to match Backstage 1.29 version

## 2.3.0

### Minor Changes

- Implemented yarn 3.x

## 2.2.1

### Patch Changes

- Fixed DB lock when using plugins DB schemas.
- Fixed use of deprecated Backstage database handlers.

## 2.2.0

### Minor Changes

- Added /generate-sample-classification API to provide easier backward migrations.

## 2.1.0

### Minor Changes

- Fixed scaffolder DB corruption when trying to backward migrate. Opened up /migrate endpoint unauthenticated. Improved DB querying through Knex.

## 2.0.0

### Major Changes

- Replaced Winston Logger with the new backend LoggerService
- Integrated new backend Auth service

### Minor Changes

- Decreased the initial delay time to fetch templates to 30 seconds.
- Removed the need for a static external token

## 1.1.0

### Minor Changes

- ec4abcc: Added changelog
