import * as pulumi from '@pulumi/pulumi';
import {
  createTimeCapsuleDynamoDBTable,
  createTimeCapsuleLambda,
  createTimeCapsuleApiGateway,
  createTimeCapsuleUIBucket,
  createTimeCapsuleCloudFrontDistribution,
  createLambdaRole,
  createSendTimeCapsuleLambda,
  createScheduledRule,
} from './lib';

const timeCapsuleTable = createTimeCapsuleDynamoDBTable();

const lambdaRole = createLambdaRole();

const apiLambda = createTimeCapsuleLambda(timeCapsuleTable, lambdaRole);

const { api: httpApi, stage } = createTimeCapsuleApiGateway(apiLambda);

export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}/${stage.name}`;

const uiBucket = createTimeCapsuleUIBucket();

const { distribution } = createTimeCapsuleCloudFrontDistribution({
  uiBucket,
  apiUrl,
  stack: pulumi.getStack(),
});

export const cloudFrontUrl = distribution.domainName;

const sendTimeCapsuleLambda = createSendTimeCapsuleLambda(
  timeCapsuleTable,
  lambdaRole
);

createScheduledRule(sendTimeCapsuleLambda);
