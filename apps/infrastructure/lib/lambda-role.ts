import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createLambdaRole(
  timeCapsuleTable: aws.dynamodb.Table
): aws.iam.Role {
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

  new aws.iam.RolePolicyAttachment('lambdaBasicExecutionPolicy', {
    role: role,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  const dynamoDBPolicy = new aws.iam.Policy('lambdaDynamoDBPolicy', {
    policy: pulumi
      .output({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: timeCapsuleTable.arn,
          },
        ],
      })
      .apply(JSON.stringify),
  });

  // Attach the custom DynamoDB policy to the role
  new aws.iam.RolePolicyAttachment('lambdaDynamoDBPolicyAttachment', {
    role: role,
    policyArn: dynamoDBPolicy.arn,
  });

  return role;
}
