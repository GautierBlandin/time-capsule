import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as url from 'url';

export function createTimeCapsuleCloudFrontDistribution({
  uiBucket,
  apiUrl,
  stack,
  domainName,
}: {
  uiBucket: aws.s3.Bucket;
  apiUrl: pulumi.Output<string>;
  stack: string;
  domainName?: string;
}): { distribution: aws.cloudfront.Distribution } {
  const cloudfrontOAC = new aws.cloudfront.OriginAccessControl(
    'cloudfrontOAC',
    {
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    }
  );

  const cachingDisabledPolicyId = '4135ea2d-6df8-44a3-9df3-4b5a84be39ad';
  const cachingOptimizedPolicyId = '658327ea-f89d-4fab-a63d-7e88639e58f6';
  const allViewerExceptHostHeaderPolicyId =
    'b689b0a8-53d0-40ab-baf2-68738e2966ac';

  const usEast1Provider = new aws.Provider('usEast1Provider', {
    region: 'us-east-1',
  });

  const certificate = domainName
    ? new aws.acm.Certificate(
        'timecapsuleCertificate',
        {
          domainName: domainName,
          validationMethod: 'DNS',
        },
        { provider: usEast1Provider }
      )
    : undefined;

  let certificateValidation: aws.acm.CertificateValidation | undefined =
    undefined;

  if (certificate) {
    const zone = pulumi.output(
      aws.route53.getZone({
        name: 'gautierblandin.com',
        privateZone: false,
      })
    );

    const validationRecords = certificate.domainValidationOptions.apply(
      (options) =>
        options.map(
          (option, index) =>
            new aws.route53.Record(`validationRecord-${index}`, {
              name: option.resourceRecordName,
              records: [option.resourceRecordValue],
              ttl: 60,
              type: option.resourceRecordType,
              zoneId: zone.id,
            })
        )
    );

    certificateValidation = new aws.acm.CertificateValidation(
      'cert',
      {
        certificateArn: certificate.arn,
        validationRecordFqdns: validationRecords.apply((records) =>
          records.map((record) => record.fqdn)
        ),
      },
      { provider: usEast1Provider }
    );
  }

  const distribution = new aws.cloudfront.Distribution(
    'simpleDistribution',
    {
      enabled: true,
      defaultRootObject: 'index.html',
      aliases: domainName ? [domainName] : undefined,
      origins: [
        {
          domainName: uiBucket.bucketRegionalDomainName,
          originId: 'S3Origin',
          originAccessControlId: cloudfrontOAC.id,
        },
        {
          originId: 'APIGatewayOrigin',
          domainName: pulumi.interpolate`${apiUrl.apply(
            (endpoint) => url.parse(endpoint).hostname
          )}`,
          originPath: pulumi.interpolate`/${stack}`,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: 'https-only',
            originSslProtocols: ['TLSv1.2'],
          },
        },
      ],

      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 'S3Origin',
        viewerProtocolPolicy: 'redirect-to-https',
        cachePolicyId: cachingOptimizedPolicyId,
        originRequestPolicyId: allViewerExceptHostHeaderPolicyId,
      },

      orderedCacheBehaviors: [
        {
          pathPattern: '/api/*',
          allowedMethods: [
            'GET',
            'HEAD',
            'OPTIONS',
            'PUT',
            'POST',
            'PATCH',
            'DELETE',
          ],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          targetOriginId: 'APIGatewayOrigin',
          cachePolicyId: cachingDisabledPolicyId,
          viewerProtocolPolicy: 'redirect-to-https',
        },
      ],

      priceClass: 'PriceClass_100',

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: certificate
        ? {
            acmCertificateArn: certificate.arn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: 'TLSv1',
          }
        : {
            cloudfrontDefaultCertificate: true,
          },
    },
    {
      dependsOn: [certificate, certificateValidation],
    }
  );

  new aws.s3.BucketPolicy(
    'allowCloudFrontBucketPolicy',
    {
      bucket: uiBucket.bucket,
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipalRead',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: ['s3:GetObject'],
            Resource: pulumi.interpolate`${uiBucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': distribution.arn,
              },
            },
          },
        ],
      },
    },
    { dependsOn: [uiBucket, distribution] }
  );

  return { distribution };
}
