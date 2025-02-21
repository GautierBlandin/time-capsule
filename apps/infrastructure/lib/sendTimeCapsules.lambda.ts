import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createSendTimeCapsuleLambda(
  timeCapsuleTable: aws.dynamodb.Table,
  role: aws.iam.Role
): aws.lambda.Function {
  const sendgridApiKey = aws.ssm.getParameter({
    name: 'sendgrid-api-key',
  });

  return new aws.lambda.Function('sendTimeCapsuleLambda', {
    code: new pulumi.asset.FileArchive(
      '../../dist/apps/server/sendTimeCapsules'
    ),
    handler: 'sendTimeCapsules.handler',
    role: role.arn,
    runtime: 'nodejs20.x',
    environment: {
      variables: {
        TIME_CAPSULE_TABLE: timeCapsuleTable.name,
        SENDGRID_API_KEY: sendgridApiKey.then((param) => param.value),
      },
    },
  });
}
