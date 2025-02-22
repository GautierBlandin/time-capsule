import * as aws from '@pulumi/aws';

export function createRoute53Record(
  domainName: string,
  distribution: aws.cloudfront.Distribution
): aws.route53.Record {
  const hostedZoneId = aws.route53
    .getZone({ name: 'gautierblandin.com' })
    .then((zone) => zone.zoneId);

  return new aws.route53.Record(domainName, {
    name: domainName,
    zoneId: hostedZoneId,
    type: 'A',
    aliases: [
      {
        name: distribution.domainName,
        zoneId: distribution.hostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  });
}
