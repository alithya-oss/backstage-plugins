import { Bulletin } from '../types';

/**
 * @private
 */
export type RequestOptions = {
  token?: string;
};

/**
 * @public
 */
export interface BulletinBoardApi {
  getBulletins(): Promise<any>;
  createBulletin(bulletin: any): Promise<any>;
  updateBulletin(id: string, bulletin: Bulletin): Promise<any>;
  deleteBulletin(id: string): Promise<void>;
}
