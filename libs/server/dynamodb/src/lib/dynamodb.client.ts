import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const createDynamoDBClient = (): DynamoDBClient => {
  const region = process.env['AWS_REGION'];

  if (!region) {
    throw new Error('AWS_REGION environment variable is not set');
  }

  return new DynamoDBClient({ region });
};
