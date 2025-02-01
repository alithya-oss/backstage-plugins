import {
  DiscoveryApi,
  IdentityApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import { Bulletin } from '../types';
import { BulletinBoardApi } from './BulletinBoardApi';

export class BulletinBoardClient implements BulletinBoardApi {
  private readonly identityApi: IdentityApi;
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: {
    identityApi: IdentityApi;
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    this.identityApi = options.identityApi;
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  async getBulletins(): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('bulletin-board');
    return await this.fetchApi
      .fetch(`${baseUrl}/bulletins`)
      .then(response => response.json());
  }

  async createBulletin(bulletin: Bulletin): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('bulletin-board');
    const user = await (await this.identityApi.getProfileInfo()).displayName;
    bulletin.user = user;
    return await this.fetchApi
      .fetch(`${baseUrl}/bulletins`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulletin),
      })
      .then(res => res.json());
  }

  async updateBulletin(id: string, bulletin: Bulletin): Promise<any> {
    const baseUrl = await this.discoveryApi.getBaseUrl('bulletin-board');
    const user = await (await this.identityApi.getProfileInfo()).displayName;
    bulletin.user = user;
    return await this.fetchApi
      .fetch(`${baseUrl}/bulletins/${id}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulletin),
      })
      .then(res => res.json());
  }

  async deleteBulletin(id: string): Promise<void> {
    const baseUrl = await this.discoveryApi.getBaseUrl('bulletin-board');
    return await this.fetchApi
      .fetch(`${baseUrl}/bulletins/${id}`, { method: 'DELETE' })
      .then(res => res.json());
  }
}
