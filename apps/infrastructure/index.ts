import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as synced from '@pulumi/synced-folder';
import * as url from 'url';

const stack = pulumi.getStack();

// Create DynamoDB table
const timeCapsuleTable = new aws.dynamodb.Table('timeCapsuleTable', {
  attributes: [
    { name: 'PK', type: 'S' },
    { name: 'SK', type: 'S' },
    { name: 'GSI1PK', type: 'S' },
    { name: 'GSI1SK', type: 'S' },
  ],
  hashKey: 'PK',
  rangeKey: 'SK',
  billingMode: 'PAY_PER_REQUEST',
  globalSecondaryIndexes: [
    {
      name: 'GSI1',
      hashKey: 'GSI1PK',
      rangeKey: 'GSI1SK',
      projectionType: 'ALL',
    },
  ],
});

// Create Lambda function
const lambdaRole = new aws.iam.Role('lambdaRole', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment('lambdaRolePolicy', {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

new aws.iam.RolePolicyAttachment('lambdaDynamoDBPolicy', {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicy.AmazonDynamoDBFullAccess,
});

const lambda = new aws.lambda.Function('timeCapsuleLambda', {
  code: new pulumi.asset.FileArchive('../../dist/apps/server'),
  handler: 'main.handler',
  role: lambdaRole.arn,
  runtime: 'nodejs20.x',
  environment: {
    variables: {
      TIME_CAPSULE_TABLE: timeCapsuleTable.name,
    },
  },
});

const httpApi = new aws.apigatewayv2.Api('httpApiGateway', {
  protocolType: 'HTTP',
  corsConfiguration: {
    allowOrigins: ['http://localhost:4200'],
    allowMethods: ['POST', 'OPTIONS'],
    allowHeaders: ['*'],
    exposeHeaders: ['*'],
    maxAge: 300,
  },
});

const lambdaPermission = new aws.lambda.Permission(
  'lambdaPermission',
  {
    action: 'lambda:InvokeFunction',
    principal: 'apigateway.amazonaws.com',
    function: lambda,
    sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
  },
  { dependsOn: [httpApi, lambda] }
);

const integration = new aws.apigatewayv2.Integration(
  'lambdaIntegration',
  {
    apiId: httpApi.id,
    integrationType: 'AWS_PROXY',
    integrationUri: lambda.arn,
    integrationMethod: 'POST',
    payloadFormatVersion: '1.0',
  },
  { dependsOn: [lambda, httpApi] }
);

const route = new aws.apigatewayv2.Route(
  'apiRoute',
  {
    apiId: httpApi.id,
    routeKey: '$default',
    target: pulumi.interpolate`integrations/${integration.id}`,
  },
  {
    dependsOn: [integration],
  }
);

const stage = new aws.apigatewayv2.Stage(
  'apiStage',
  {
    apiId: httpApi.id,
    name: pulumi.getStack(),
    routeSettings: [
      {
        routeKey: route.routeKey,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
    ],
    autoDeploy: true,
  },
  { dependsOn: [route, integration] }
);

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
const allVieverExceptHostHeaderPolicyId =
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
    forwardedValues: {
      queryString: false,
      cookies: { forward: 'none' },
    },
    viewerProtocolPolicy: 'redirect-to-https',
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
  },

  orderedCacheBehaviors: [
    {
      pathPattern: '/dev/*',
      allowedMethods: [
        'GET',
        'HEAD',
        'OPTIONS',
        'PUT',
        'POST',
        'PATCH',
        'DELETE',
      ],
      cachedMethods: ['GET', 'HEAD'],
      targetOriginId: 'APIGatewayOrigin',
      forwardedValues: {
        queryString: true,
        headers: ['Origin'],
        cookies: { forward: 'all' },
      },
      minTtl: 0,
      defaultTtl: 0,
      maxTtl: 0,
      compress: true,
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
