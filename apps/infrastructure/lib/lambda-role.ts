import * as aws from '@pulumi/aws';

export function createLambdaRole(): aws.iam.Role {
  const role = new aws.iam.Role('lambdaRole', {
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
    role: role,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  new aws.iam.RolePolicyAttachment('lambdaDynamoDBPolicy', {
    role: role,
    policyArn: aws.iam.ManagedPolicy.AmazonDynamoDBFullAccess,
  });

  return role;
}
