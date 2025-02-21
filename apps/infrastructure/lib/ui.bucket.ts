import * as aws from '@pulumi/aws';
import * as synced from '@pulumi/synced-folder';

export function createTimeCapsuleUIBucket(): aws.s3.Bucket {
  const uiBucket = new aws.s3.Bucket('ui-static');

  new synced.S3BucketFolder('synced-folder', {
    path: '../../dist/apps/ui',
    bucketName: uiBucket.bucket,
    acl: 'private',
  });

  return uiBucket;
}
