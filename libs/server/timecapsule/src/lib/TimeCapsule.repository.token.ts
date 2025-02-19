import { createInjectionToken } from '@timecapsule/di';
import { TimeCapsuleRepository } from './TimeCapsule.repository';

export const timeCapsuleRepositoryToken = createInjectionToken<TimeCapsuleRepository>('timeCapsuleRepository');
