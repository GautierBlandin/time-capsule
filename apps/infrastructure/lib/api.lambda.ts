import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createTimeCapsuleLambda(
  timeCapsuleTable: aws.dynamodb.Table
): aws.lambda.Function {
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
