import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createTimeCapsuleApiGateway(lambda: aws.lambda.Function): {
  api: aws.apigatewayv2.Api;
  stage: aws.apigatewayv2.Stage;
} {
  const httpApi = new aws.apigatewayv2.Api('httpApiGateway', {
    protocolType: 'HTTP',
    corsConfiguration: {
      allowOrigins: ['http://localhost:4200'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['*'],
      exposeHeaders: ['*'],
      maxAge: 300,
    },
  });

  new aws.lambda.Permission(
    'lambdaPermission',
    {
      action: 'lambda:InvokeFunction',
      principal: 'apigateway.amazonaws.com',
      function: lambda,
      sourceArn: pulumi.interpolate`${httpApi.executionArn}/*/*`,
    },
    { dependsOn: [httpApi, lambda] }
  );

  const integration = new aws.apigatewayv2.Integration(
    'lambdaIntegration',
    {
      apiId: httpApi.id,
      integrationType: 'AWS_PROXY',
      integrationUri: lambda.arn,
      integrationMethod: 'POST',
      payloadFormatVersion: '1.0',
    },
    { dependsOn: [lambda, httpApi] }
  );

  const route = new aws.apigatewayv2.Route(
    'apiRoute',
    {
      apiId: httpApi.id,
      routeKey: '$default',
      target: pulumi.interpolate`integrations/${integration.id}`,
    },
    {
      dependsOn: [integration],
    }
  );

  const stage = new aws.apigatewayv2.Stage(
    'apiStage',
    {
      apiId: httpApi.id,
      name: pulumi.getStack(),
      routeSettings: [
        {
          routeKey: route.routeKey,
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 10000,
        },
      ],
      autoDeploy: true,
    },
    { dependsOn: [route, integration] }
  );

  return {
    api: httpApi,
    stage: stage,
  };
}
