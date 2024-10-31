# @alithya-oss/plugin-time-saver-react

## 1.0.0

### Major Changes

- a349c3f: BREAKING CHANGE: Created react library along with all chart components, forms and other react components used in the frontend library. All these now implement proper Backstage services encapsulated in hooks to communicate with the backend. These components do not longer exist in the frontend plugin, hence they should be imported from the react plugin. Finally, the react library plugin must be installed in order for the time saver plugin to continue working correctly.

### Patch Changes

- Updated dependencies [a349c3f]
  - @alithya-oss/plugin-time-saver-common@0.6.0
