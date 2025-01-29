/**
 * @public
 */
export type Bulletin = {
  bulletin_id: string;
  bulletin_title: string;
  bulletin_url: string;
  bulletin_description: string;
  bulletin_tags: string;
  user: string | undefined;
  updated_at: string;
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
