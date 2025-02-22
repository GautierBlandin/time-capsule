import * as pulumi from '@pulumi/pulumi';
import {
  createTimeCapsuleDynamoDBTable,
  createTimeCapsuleLambda,
  createTimeCapsuleApiGateway,
  createTimeCapsuleUIBucket,
  createTimeCapsuleCloudFrontDistribution,
  createSendTimeCapsuleLambda,
  createScheduledRule,
  createRoute53Record,
} from './lib';

const domainName =
  pulumi.getStack() === 'prod' ? 'timecapsules.gautierblandin.com' : undefined;

const timeCapsuleTable = createTimeCapsuleDynamoDBTable();

const apiLambda = createTimeCapsuleLambda(timeCapsuleTable);

const { api: httpApi, stage } = createTimeCapsuleApiGateway(apiLambda);

export const apiUrl = pulumi.interpolate`${httpApi.apiEndpoint}/${stage.name}`;

const uiBucket = createTimeCapsuleUIBucket();

const { distribution } = createTimeCapsuleCloudFrontDistribution({
  uiBucket,
  apiUrl,
  stack: pulumi.getStack(),
  domainName,
});

if (domainName) {
  createRoute53Record(domainName, distribution);
}

export const cloudFrontUrl = distribution.domainName;

const sendTimeCapsuleLambda = createSendTimeCapsuleLambda(timeCapsuleTable);

createScheduledRule(sendTimeCapsuleLambda);
