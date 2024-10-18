import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createBackendModule } from '@backstage/backend-plugin-api';

// import { createSendNotificationAction } from '@backstage/plugin-scaffolder-backend-module-notifications';

import {
  createZipAction,
  createSleepAction,
  createWriteFileAction,
  createAppendFileAction,
  createMergeJSONAction,
  createMergeAction,
  createParseFileAction,
  createSerializeYamlAction,
  createSerializeJsonAction,
  createJSONataAction,
  createYamlJSONataTransformAction,
  createJsonJSONataTransformAction,
} from '@roadiehq/scaffolder-backend-module-utils';

export default createBackendModule({
  pluginId: 'scaffolder', // name of the plugin that the module is targeting
  moduleId: 'custom-extensions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        // ... and other dependencies as needed
      },
      async init({ scaffolder /* ..., other dependencies */ }) {
        // Here you have the opportunity to interact with the extension
        // point before the plugin itself gets instantiated
        scaffolder.addActions(createZipAction());
        scaffolder.addActions(createSleepAction());
        scaffolder.addActions(createWriteFileAction());
        scaffolder.addActions(createAppendFileAction());
        scaffolder.addActions(createMergeJSONAction({}));
        scaffolder.addActions(createMergeAction());
        scaffolder.addActions(createParseFileAction());
        scaffolder.addActions(createSerializeYamlAction());
        scaffolder.addActions(createSerializeJsonAction());
        scaffolder.addActions(createJSONataAction());
        scaffolder.addActions(createYamlJSONataTransformAction());
        scaffolder.addActions(createJsonJSONataTransformAction());
        // scaffolder.addActions(createSendNotificationAction({}));
      },
    });
  },
});
