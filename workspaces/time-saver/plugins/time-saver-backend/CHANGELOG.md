# @alithya-oss/plugin-time-saver-backend

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
