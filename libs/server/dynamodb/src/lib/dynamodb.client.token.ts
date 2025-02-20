import { createInjectionToken } from '@timecapsule/di';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createDynamoDBClient } from './dynamodb.client';

export const dynamoDBClientToken = createInjectionToken<DynamoDBClient>(
  'dynamoDBClientToken',
  {
    useFactory: createDynamoDBClient,
  }
);
