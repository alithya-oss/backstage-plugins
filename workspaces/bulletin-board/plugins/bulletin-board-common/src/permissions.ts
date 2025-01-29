import {
  BasicPermission,
  createPermission,
  isPermission,
  ResourcePermission,
} from '@backstage/plugin-permission-common';

/**
 * @public
 */
export const bulletinBoardCreatePermission = createPermission({
  name: 'bulletinboard.bulletin.create',
  attributes: { action: 'create' },
});

/**
 * @public
 */
export const bulletinBoardReadPermission = createPermission({
  name: 'bulletinboard.bulletin.read',
  attributes: { action: 'read' },
});

/**
 * @public
 */
export const bulletinBoardUpdatedPermission = createPermission({
  name: 'bulletinboard.bulletin.update',
  attributes: { action: 'update' },
});

/**
 * @public
 */
export const bulletinBoardDeletePermission = createPermission({
  name: 'bulletinboard.bulletin.delete',
  attributes: { action: 'delete' },
});

/**
 * @public
 */
export const bulletinBoardPermissions = [
  bulletinBoardCreatePermission,
  bulletinBoardReadPermission,
  bulletinBoardUpdatedPermission,
  bulletinBoardDeletePermission,
];

/**
 * @public
 */
export const isBulletinBoardPermission = (
  permission: BasicPermission | ResourcePermission,
) => {
  return bulletinBoardPermissions.some(p => isPermission(permission, p));
};
