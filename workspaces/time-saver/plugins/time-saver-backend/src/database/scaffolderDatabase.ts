import { Config } from '@backstage/config';
import Knex from 'knex';

export interface SSLParameters {
  ca: string;
}
export interface DatabaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: SSLParameters;
}
export interface DatabaseConfiguration {
  client: string;
  connection: DatabaseConnection;
  pluginDivisionMode: string;
}

export class ScaffolderDatabase {
  constructor(private readonly config: Config) {}

  private readonly scaffolderDatabaseName = 'backstage_plugin_scaffolder';

  scaffolderKnex() {
    const  : DatabaseConfiguration | undefined =
      this.config.getOptional('backend.database');

    if (dbConfig) {
      const knex: Knex.Knex = Knex({
        client: dbConfig.client,
        connection: {
          host: dbConfig.connection.host,
          port: dbConfig.connection.port,
          user: dbConfig.connection.user,
          password: dbConfig.connection.password,
          database:
            dbConfig.pluginDivisionMode === 'schema'
              ? dbConfig.connection.database
              : this.scaffolderDatabaseName,
          ssl: dbConfig.connection.ssl?.ca
            ? { rejectUnauthorized: false }
            : false,
        },
        searchPath:
          dbConfig.pluginDivisionMode === 'schema' ? ['scaffolder'] : undefined,
      });
      return knex;
    }
    return null;
  }
}