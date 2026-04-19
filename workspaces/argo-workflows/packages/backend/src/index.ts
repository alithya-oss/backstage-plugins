import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage-community/plugin-argo-workflows-backend'));

backend.start();
