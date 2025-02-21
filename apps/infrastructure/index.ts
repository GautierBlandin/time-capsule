import * as pulumi from '@pulumi/pulumi';
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
