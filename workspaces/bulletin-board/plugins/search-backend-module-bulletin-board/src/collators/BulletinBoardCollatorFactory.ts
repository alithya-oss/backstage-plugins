import { Config } from '@backstage/config';
import { Readable } from 'stream';
import { DocumentCollatorFactory } from '@backstage/plugin-search-common';
import {
  BulletinBoardApi,
  BulletinBoardClient,
  Bulletin,
} from '@alithya-oss/backstage-plugin-bulletin-board-common';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';

export type BulletinBoardCollatorFactoryOptions = {
  logger: LoggerService;
  discovery: DiscoveryService;
  auth?: AuthService;
};

export class BulletinBoardCollatorFactory implements DocumentCollatorFactory {
  public readonly type: string = 'bulletin-board';
  private readonly logger: LoggerService;
  private readonly auth?: AuthService;
  private readonly api: BulletinBoardApi;

  private constructor(_config: Config, options: BulletinBoardCollatorFactoryOptions) {
    this.logger = options.logger;
    this.auth = options.auth;
    this.api = new BulletinBoardClient({ discoveryApi: options.discovery });
  }

  static fromConfig(config: Config, options: BulletinBoardCollatorFactoryOptions) {
    return new BulletinBoardCollatorFactory(config, options);
  }

  async getCollator() {
    return Readable.from(this.execute());
  }

  async *execute(): AsyncGenerator<Bulletin> {
    this.logger.info('Executing Bulletin Board Collator');
    let totalPosts = Number.MAX_VALUE;
    let indexedPosts = 0;

    while (totalPosts > indexedPosts) {
      let tok = undefined;

      if (this.auth) {
        const { token } = await this.auth.getPluginRequestToken({
          onBehalfOf: await this.auth.getOwnServiceCredentials(),
          targetPluginId: 'bulletin-board',
        });
        tok = token;
      }

      const data = await this.api.getBulletins();

      if (!data || 'errors' in data || !('posts' in data)) {
        this.logger.error(
          `Error while fetching posts from bulletin-board: ${JSON.stringify(data)}`,
        );
        return;
      }

      const bulletins = data.bulletins;
      this.logger.info(`Indexing ${bulletins.length} bulletins`);
      totalBulletins = data.total;
      indexedBulletins += bulletins.length;

      for (const bulletin of bulletins) {
        const postContent = `# ${
          bulletin.type === 'bulletin' ? 'Bulletin' : 'Bulletin'
        }: ${bulletin.title}\n\n${bulletin.bulletin_description}`;

        const allComments = (post.comments ?? []).concat(
          (bulletin.answers ?? []).flatMap(a => a.comments ?? []),
        );
        const commentsContent = allComments.map(c => {
          return `* Comment by ${c.author}: ${c.content}`;
        });

        yield {
          title: post.title,
          text: `${postContent}\n\n${answersContent.join(
            '\n\n',
          )}\n\nComments:\n\n${commentsContent.join('\n\n')}`,
          location:
            post.type === 'question'
              ? `/qeta/questions/${post.id}`
              : `/qeta/articles/${post.id}`,
          docType: 'qeta_post',
          author: post.author,
          score: post.score,
          entityRefs: post.entities,
          answerCount: post.answersCount,
          views: post.views,
          tags: post.tags,
        };
      }
    }

    let totalCollections = Number.MAX_VALUE;
    let indexedCollections = 0;

    while (totalCollections > indexedCollections) {
      let tok = undefined;

      if (this.auth) {
        const { token } = await this.auth.getPluginRequestToken({
          onBehalfOf: await this.auth.getOwnServiceCredentials(),
          targetPluginId: 'qeta',
        });
        tok = token;
      }

      const data = await this.api.getCollections(
        {
          orderBy: 'created',
          order: 'asc',
          limit: 50,
          offset: indexedCollections,
        },
        { token: tok },
      );

      if (!data || 'errors' in data || !('collections' in data)) {
        this.logger.error(
          `Error while fetching collections from qeta: ${JSON.stringify(data)}`,
        );
        return;
      }

      const collections = data.collections;
      this.logger.info(`Indexing ${collections.length} collections`);
      totalCollections = data.total;
      indexedCollections += collections.length;

      for (const collection of collections) {
        yield {
          title: collection.title,
          text: collection.description ?? '',
          location: `/qeta/collections/${collection.id}`,
          docType: 'qeta_collection',
          owner: collection.owner,
          created: collection.created,
          headerImage: collection.headerImage,
        };
      }
    }
  }
}