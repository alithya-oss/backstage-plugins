# @alithya-oss/plugin-time-saver

## 1.4.1

### Patch Changes

- a854796: Restated Time Saver react library and fixed workspace in order to continue to be capable of generating api-reports. The workspace has also been updated with Backstage version 1.32.5, which provides knip reports holding information about unused packages.
- Updated dependencies [a854796]
  - @alithya-oss/plugin-time-saver-common@0.5.1
  - @alithya-oss/plugin-time-saver-react@0.1.1

## 1.4.0

### Minor Changes

- cc89fa6: Updated all chart components to check for an error response when fetching data. If there's an error, a message should be displayed instead of trying to render a chart. This generates backward compatibility with the upgraded Time Saver backend plugin.

### Patch Changes

- Updated dependencies [cc89fa6]
  - @alithya-oss/plugin-time-saver-common@0.5.0

## 1.3.0

### Minor Changes

- Provided dependencies upgrade to match Backstage 1.29 version
- Migrated time-saver workspace plugins to Alithya's Backstage community plugins repository

## 1.2.0

### Minor Changes

- Implemented yarn 3.x

### Patch Changes

- Fixed incompatible or missing types definitions in components.

## 1.1.0

### Minor Changes

- ec4abcc: Added changelog
