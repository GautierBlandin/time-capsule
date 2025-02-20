import { createInjectionToken } from '@timecapsule/di';
import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { DynamoDBTimeCapsuleRepository } from './TimeCapsule.repository.ddb';

export const timeCapsuleRepositoryToken =
  createInjectionToken<TimeCapsuleRepository>('timeCapsuleRepository', {
    useClass: DynamoDBTimeCapsuleRepository,
  });
