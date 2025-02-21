import * as aws from '@pulumi/aws';

export function createLambdaRole(lambdaName: string): aws.iam.Role {
  const assumeRole = aws.iam.getPolicyDocument({
    statements: [
      {
        effect: 'Allow',
        principals: [
          {
            type: 'Service',
            identifiers: ['lambda.amazonaws.com'],
          },
        ],
        actions: ['sts:AssumeRole'],
      },
    ],
  });
  const role = new aws.iam.Role(`${lambdaName}Role`, {
    name: `${lambdaName}Role`,
    assumeRolePolicy: assumeRole.then((assumeRole) => assumeRole.json),
  });

  new aws.iam.RolePolicyAttachment(`${lambdaName}RolePolicy`, {
    role: role,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  new aws.iam.RolePolicyAttachment(`${lambdaName}DynamoDBPolicy`, {
    role: role,
    policyArn: aws.iam.ManagedPolicy.AmazonDynamoDBFullAccess,
  });

  return role;
}
