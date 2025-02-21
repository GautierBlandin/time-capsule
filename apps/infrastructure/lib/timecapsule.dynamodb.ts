import * as aws from '@pulumi/aws';
import { Table } from '@pulumi/aws/dynamodb';

export function createTimeCapsuleDynamoDBTable(): Table {
  return new aws.dynamodb.Table('timeCapsuleTable', {
    attributes: [
      { name: 'PK', type: 'S' },
      { name: 'SK', type: 'S' },
      { name: 'GSI1PK', type: 'S' },
      { name: 'GSI1SK', type: 'S' },
    ],
    hashKey: 'PK',
    rangeKey: 'SK',
    billingMode: 'PAY_PER_REQUEST',
    globalSecondaryIndexes: [
      {
        name: 'GSI1',
        hashKey: 'GSI1PK',
        rangeKey: 'GSI1SK',
        projectionType: 'ALL',
      },
    ],
  });
}
