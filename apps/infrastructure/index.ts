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
