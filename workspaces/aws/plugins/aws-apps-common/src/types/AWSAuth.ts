import { AwsCredentialIdentity } from '@aws-sdk/types';

/**
 * Response containing AWS credentials and metadata for an assumed role.
 *
 * @public
 */
export interface AwsAuthResponse {
  credentials: AwsCredentialIdentity;
  requester: string;
  owner?: string;
  roleArn: string;
  account: string;
  region: string;
}
