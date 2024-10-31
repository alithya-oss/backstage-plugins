# @alithya-oss/plugin-time-saver

## 2.0.0

### Major Changes

- a349c3f: BREAKING CHANGE: Created react library along with all chart components, forms and other react components used in the frontend library. All these now implement proper Backstage services encapsulated in hooks to communicate with the backend. These components do not longer exist in the frontend plugin, hence they should be imported from the react plugin. Finally, the react library plugin must be installed in order for the time saver plugin to continue working correctly.

### Patch Changes

- Updated dependencies [a349c3f]
- Updated dependencies [a349c3f]
  - @alithya-oss/plugin-time-saver-react@1.0.0
  - @alithya-oss/plugin-time-saver-common@0.6.0

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
