import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createTimeCapsuleLambda(
  timeCapsuleTable: aws.dynamodb.Table,
  role: aws.iam.Role
): aws.lambda.Function {
  return new aws.lambda.Function('timeCapsuleLambda', {
    code: new pulumi.asset.FileArchive('../../dist/apps/server/api'),
    handler: 'api.handler',
    role: role.arn,
    runtime: 'nodejs20.x',
    environment: {
      variables: {
        TIME_CAPSULE_TABLE: timeCapsuleTable.name,
      },
    },
  });
}
