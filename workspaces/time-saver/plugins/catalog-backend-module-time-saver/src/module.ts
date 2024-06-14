import { createBackendModule } from "@backstage/backend-plugin-api";
import { catalogProcessingExtensionPoint } from "@backstage/plugin-catalog-node/alpha";
import { TimeSavedProcessor } from "./processors/TimeSavedProcessor";

export const catalogModuleTImeSavedProcessor = createBackendModule({
  pluginId: "catalog",
  moduleId: "time-saver-processor",
  register(env) {
    env.registerInit({
      deps: { catalog: catalogProcessingExtensionPoint },
      async init({ catalog }) {
        catalog.addProcessor(new TimeSavedProcessor());
      },
    });
  },
});