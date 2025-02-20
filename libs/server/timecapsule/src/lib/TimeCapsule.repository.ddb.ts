import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { inject } from '@timecapsule/di';
import { dynamoDBClientToken } from '@timecapsule/dynamodb';

export class DynamoDBTimeCapsuleRepository implements TimeCapsuleRepository {
  private readonly dynamoDBClient: DynamoDBClient = inject(dynamoDBClientToken);
  private readonly tableName: string;

  constructor() {
    const tableName = process.env['TIME_CAPSULE_TABLE'];

    if (!tableName) {
      throw new Error('TIME_CAPSULE_TABLE environment variable is not set');
    }

    this.tableName = tableName;
  }

  async saveTimeCapsule(timeCapsule: TimeCapsule): Promise<void> {
    const marshalled = marshall(timeCapsule);

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshalled,
    });

    try {
      await this.dynamoDBClient.send(command);
    } catch (_) {
      throw new Error('Failed to save time capsule');
    }
  }
}
