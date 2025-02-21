import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as synced from '@pulumi/synced-folder';
import * as url from 'url';
import {
  createTimeCapsuleDynamoDBTable,
  createTimeCapsuleLambda,
  createTimeCapsuleApiGateway,
} from './lib';

const stack = pulumi.getStack();

const timeCapsuleTable = createTimeCapsuleDynamoDBTable();

const lambda = createTimeCapsuleLambda(timeCapsuleTable);

const { api: httpApi, stage } = createTimeCapsuleApiGateway(lambda);

// Export the API endpoint
export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}/${stage.name}`;

// Create an AWS resource (S3 Bucket)
const uiBucket = new aws.s3.Bucket('ui-static');

new synced.S3BucketFolder('synced-folder', {
  path: '../../dist/apps/ui',
  bucketName: uiBucket.bucket,
  acl: 'private',
});

const cloudfrontOAC = new aws.cloudfront.OriginAccessControl('cloudfrontOAC', {
  originAccessControlOriginType: 's3',
  signingBehavior: 'always',
  signingProtocol: 'sigv4',
});
const cachingDisabledPolicyId = '4135ea2d-6df8-44a3-9df3-4b5a84be39ad';
const cachingOptimizedPolicyId = '658327ea-f89d-4fab-a63d-7e88639e58f6';
const allViewerExceptHostHeaderPolicyId =
  'b689b0a8-53d0-40ab-baf2-68738e2966ac';

const distribution = new aws.cloudfront.Distribution('simpleDistribution', {
  enabled: true,
  defaultRootObject: 'index.html',

  origins: [
    {
      domainName: uiBucket.bucketRegionalDomainName,
      originId: 'S3Origin',
      originAccessControlId: cloudfrontOAC.id,
    },
    {
      originId: 'APIGatewayOrigin',
      domainName: pulumi.interpolate`${apiUrl.apply(
        (endpoint) => url.parse(endpoint).hostname
      )}`,
      originPath: pulumi.interpolate`/${stack}`,
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: 'https-only',
        originSslProtocols: ['TLSv1.2'],
      },
    },
  ],

  defaultCacheBehavior: {
    allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
    cachedMethods: ['GET', 'HEAD'],
    targetOriginId: 'S3Origin',
    viewerProtocolPolicy: 'redirect-to-https',
    cachePolicyId: cachingOptimizedPolicyId,
    originRequestPolicyId: allViewerExceptHostHeaderPolicyId,
  },

  orderedCacheBehaviors: [
    {
      pathPattern: '/api/*',
      allowedMethods: [
        'GET',
        'HEAD',
        'OPTIONS',
        'PUT',
        'POST',
        'PATCH',
        'DELETE',
      ],
      cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
      targetOriginId: 'APIGatewayOrigin',
      cachePolicyId: cachingDisabledPolicyId,
      viewerProtocolPolicy: 'redirect-to-https',
    },
  ],

  priceClass: 'PriceClass_100',

  restrictions: {
    geoRestriction: {
      restrictionType: 'none',
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },
});

new aws.s3.BucketPolicy(
  'allowCloudFrontBucketPolicy',
  {
    bucket: uiBucket.bucket,
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowCloudFrontServicePrincipalRead',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudfront.amazonaws.com',
          },
          Action: ['s3:GetObject'],
          Resource: pulumi.interpolate`${uiBucket.arn}/*`,
          Condition: {
            StringEquals: {
              'AWS:SourceArn': distribution.arn,
            },
          },
        },
      ],
    },
  },
  { dependsOn: [uiBucket, distribution] }
);

export const cloudFrontUrl = distribution.domainName;
