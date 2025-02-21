import * as pulumi from '@pulumi/pulumi';
import {
  createTimeCapsuleDynamoDBTable,
  createTimeCapsuleLambda,
  createTimeCapsuleApiGateway,
  createTimeCapsuleUIBucket,
  createTimeCapsuleCloudFrontDistribution,
  createSendTimeCapsuleLambda,
  createScheduledRule,
} from './lib';

const timeCapsuleTable = createTimeCapsuleDynamoDBTable();

const apiLambda = createTimeCapsuleLambda(timeCapsuleTable);

const { api: httpApi, stage } = createTimeCapsuleApiGateway(apiLambda);

export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}/${stage.name}`;

const uiBucket = createTimeCapsuleUIBucket();

const { distribution } = createTimeCapsuleCloudFrontDistribution({
  uiBucket,
  apiUrl,
  stack: pulumi.getStack(),
});

export const cloudFrontUrl = distribution.domainName;

const sendTimeCapsuleLambda = createSendTimeCapsuleLambda(timeCapsuleTable);

createScheduledRule(sendTimeCapsuleLambda);
