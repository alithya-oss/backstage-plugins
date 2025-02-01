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
