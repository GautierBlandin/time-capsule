import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createLambdaRole } from './lambda-role';

export function createTimeCapsuleLambda(
  timeCapsuleTable: aws.dynamodb.Table
): aws.lambda.Function {
  const lambdaRole = createLambdaRole('apiLambda');

  return new aws.lambda.Function('timeCapsuleLambda', {
    code: new pulumi.asset.FileArchive('../../dist/apps/server/api'),
    handler: 'api.handler',
    role: lambdaRole.arn,
    runtime: 'nodejs20.x',
    environment: {
      variables: {
        TIME_CAPSULE_TABLE: timeCapsuleTable.name,
      },
    },
  });
}
