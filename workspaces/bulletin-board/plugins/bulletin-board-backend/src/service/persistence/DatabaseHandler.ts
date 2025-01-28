import {
  DatabaseService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';

const migrationsDir = resolvePackagePath(
  '@alithya-oss/backstage-plugin-bulletin-board-backend',
  'migrations',
);

type Options = {
  database: DatabaseService;
};

type Body = {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string;
  user: string;
};

export class DatabaseHandler {
  static async create(options: Options): Promise<DatabaseHandler> {
    const { database } = options;
    const client: any = await database.getClient();

    if (!database.migrations?.skip) {
      await client.migrate.latest({
        directory: migrationsDir,
      });
    }

    return new DatabaseHandler(client);
  }

  private readonly client: Knex;

  private constructor(client: Knex) {
    this.client = client;
  }

  getBulletins = async () => {
    return await this.client
      .select()
      .orderBy('updated_at', 'desc')
      .from('bulletins');
  };

  createBulletin = async (body: Body) => {
    await this.client
      .insert({
        bulletin_id: body.id,
        bulletin_title: body.title,
        bulletin_description: body.description,
        bulletin_url: body.url,
        bulletin_tags: body.tags.toString(),
        created_by: body.user,
        updated_by: body.user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .into('bulletins');
  };

  updateBulletin = async (id: string, body: Body) => {
    return await this.client('bulletins').where({ bulletin_id: id }).update({
      bulletin_id: body.id,
      bulletin_title: body.title,
      bulletin_description: body.description,
      bulletin_url: body.url,
      bulletin_tags: body.tags.toString(),
      updated_by: body.user,
      updated_at: new Date().toISOString(),
    });
  };

  deleteBulletin = async (id: string) => {
    return await this.client('bulletins').where({ bulletin_id: id }).del();
  };
}
