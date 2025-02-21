import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import {
  createTimeCapsuleDynamoDBTable,
  createTimeCapsuleLambda,
  createTimeCapsuleApiGateway,
  createTimeCapsuleUIBucket,
  createTimeCapsuleCloudFrontDistribution,
} from './lib';

const timeCapsuleTable = createTimeCapsuleDynamoDBTable();

const lambda = createTimeCapsuleLambda(timeCapsuleTable);

const { api: httpApi, stage } = createTimeCapsuleApiGateway(lambda);

export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}/${stage.name}`;

const uiBucket = createTimeCapsuleUIBucket();

const { distribution } = createTimeCapsuleCloudFrontDistribution({
  uiBucket,
  apiUrl,
  stack: pulumi.getStack(),
});

export const cloudFrontUrl = distribution.domainName;

// Create the lambda function for sending time capsules
const sendTimeCapsuleLambda = new aws.lambda.Function('sendTimeCapsuleLambda', {
  code: new pulumi.asset.FileArchive('../../dist/apps/server/sendTimeCapsules'),
  handler: 'sendTimeCapsules.handler',
  role: lambda.role, // Reuse the role from the existing lambda
  runtime: 'nodejs20.x',
  environment: {
    variables: {
      TIME_CAPSULE_TABLE: timeCapsuleTable.name,
    },
  },
});

// Create a scheduled rule to trigger the lambda every minute
const scheduledRule = new aws.cloudwatch.EventRule(
  'sendTimeCapsuleScheduledRule',
  {
    scheduleExpression: 'rate(1 minute)',
  }
);

// Grant the scheduled rule permission to invoke the Lambda function
const lambdaPermission = new aws.lambda.Permission(
  'scheduledRuleLambdaPermission',
  {
    action: 'lambda:InvokeFunction',
    function: sendTimeCapsuleLambda,
    principal: 'events.amazonaws.com',
    sourceArn: scheduledRule.arn,
  }
);

// Connect the scheduled rule to the lambda function
const ruleTarget = new aws.cloudwatch.EventTarget('sendTimeCapsuleRuleTarget', {
  rule: scheduledRule.name,
  arn: sendTimeCapsuleLambda.arn,
});
