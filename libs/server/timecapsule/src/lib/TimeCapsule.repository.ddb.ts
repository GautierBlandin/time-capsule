import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
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
    const item = createTimeCapsuleDynamoDBItem(timeCapsule);
    const marshalled = marshall(item);

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshalled,
    });

    try {
      await this.dynamoDBClient.send(command);
    } catch (error) {
      throw new Error('Failed to save time capsule');
    }
  }

  async getTimeCapsuleById(id: string): Promise<TimeCapsule | null> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: marshall({ PK: `TIMECAPSULE#${id}`, SK: `TIMECAPSULE#${id}` }),
    });

    try {
      const { Item } = await this.dynamoDBClient.send(command);
      if (!Item) return null;
      const dynamoDBItem = unmarshall(Item) as TimeCapsuleDynamoDBItem;
      return createTimeCapsuleFromDynamoDBItem(dynamoDBItem);
    } catch (error) {
      throw new Error('Failed to get time capsule by id');
    }
  }

  async getTimeCapsulesBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<TimeCapsule[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end',
      ExpressionAttributeValues: marshall({
        ':pk': 'SCHEDULED',
        ':start': startDate.toISOString(),
        ':end': endDate.toISOString(),
      }),
    });

    try {
      const { Items } = await this.dynamoDBClient.send(command);
      if (!Items) return [];
      return Items.map((item) => {
        const dynamoDBItem = unmarshall(item) as TimeCapsuleDynamoDBItem;
        return createTimeCapsuleFromDynamoDBItem(dynamoDBItem);
      });
    } catch (error) {
      console.error('Failed to get time capsules between dates:', error);
      throw new Error('Failed to get time capsules between dates');
    }
  }
}

export interface TimeCapsuleDynamoDBItem
  extends Omit<TimeCapsule, 'scheduledDate' | 'createdAt'> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  scheduledDate: string;
  createdAt: string;
}

export const createTimeCapsuleDynamoDBItem = (
  timeCapsule: TimeCapsule
): TimeCapsuleDynamoDBItem => ({
  PK: `TIMECAPSULE#${timeCapsule.id}`,
  SK: `TIMECAPSULE#${timeCapsule.id}`,
  GSI1PK: 'SCHEDULED',
  GSI1SK: timeCapsule.scheduledDate.toISOString(),
  ...timeCapsule,
  scheduledDate: timeCapsule.scheduledDate.toISOString(),
  createdAt: timeCapsule.createdAt.toISOString(),
});

export const createTimeCapsuleFromDynamoDBItem = (
  item: TimeCapsuleDynamoDBItem
): TimeCapsule => ({
  ...item,
  scheduledDate: new Date(item.scheduledDate),
  createdAt: new Date(item.createdAt),
});
