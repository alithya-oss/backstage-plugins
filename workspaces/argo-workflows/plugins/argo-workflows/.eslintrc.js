const config = require('@backstage/cli/config/eslint-factory')(__dirname);

// This plugin uses Backstage UI (BUI) components and native HTML elements
// instead of Material UI. Disable the MUI-specific forbid-elements rule.
config.rules = {
  ...config.rules,
  'react/forbid-elements': 'off',
};

module.exports = config;
