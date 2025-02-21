import * as aws from '@pulumi/aws';

export function createScheduledRule(lambda: aws.lambda.Function): {
  rule: aws.cloudwatch.EventRule;
  target: aws.cloudwatch.EventTarget;
} {
  const scheduledRule = new aws.cloudwatch.EventRule(
    'sendTimeCapsuleScheduledRule',
    {
      scheduleExpression: 'rate(1 minute)',
    }
  );

  new aws.lambda.Permission('scheduledRuleLambdaPermission', {
    action: 'lambda:InvokeFunction',
    function: lambda,
    principal: 'events.amazonaws.com',
    sourceArn: scheduledRule.arn,
  });

  const ruleTarget = new aws.cloudwatch.EventTarget(
    'sendTimeCapsuleRuleTarget',
    {
      rule: scheduledRule.name,
      arn: lambda.arn,
    }
  );

  return { rule: scheduledRule, target: ruleTarget };
}
