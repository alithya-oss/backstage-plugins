# Backstage Plugin Bulletin Board (Backend Setup)

Add the backend plugin package:

```bash
# From your Backstage root directory
yarn workspace backend add backstage-plugin-bulletin-board-backend
```

Edit the `packages/backend/src/index.ts`:

In `packages/backend/src/index.ts` add the following:

```diff
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
...
+ backend.add(import('@alithya-oss/backstage-plugin-bulletin-board-backend'));

backend.start();
```
