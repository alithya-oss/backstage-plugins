import { createApiRef } from '@backstage/core-plugin-api';
import { BulletinBoardApi } from '@alithya-oss/backstage-plugin-bulletin-board-common';

/**
 * @public
 */
export const bulletinBoardApiRef = createApiRef<BulletinBoardApi>({
  id: 'bulletin-board',
});
