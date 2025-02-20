import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as apigateway from '@pulumi/aws-apigateway';

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

// Create API Gateway
const api = new apigateway.RestAPI('api', {
  routes: [
    {
      path: '/timecapsule',
      method: 'POST',
      eventHandler: lambda,
    },
  ],
});

// Export the API endpoint
export const apiUrl = api.url;
