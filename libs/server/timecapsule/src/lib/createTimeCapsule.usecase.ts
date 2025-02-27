import { inject } from '@timecapsule/di';
import { v4 as uuidv4 } from 'uuid';
import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';

export type CreateTimeCapsuleInput = Omit<
  TimeCapsule,
  'id' | 'createdAt' | 'status'
>;
export class CreateTimeCapsuleUseCase {
  private timeCapsuleRepository: TimeCapsuleRepository = inject(
    timeCapsuleRepositoryToken
  );

  async execute(input: CreateTimeCapsuleInput): Promise<TimeCapsule> {
    const now = new Date();
    const minimumScheduledDate = new Date(now.getTime() - 60000);

    if (input.scheduledDate <= minimumScheduledDate) {
      throw new TooEarlyToScheduleTimeCapsuleError();
    }

    const timeCapsule: TimeCapsule = {
      id: uuidv4(),
      message: input.message,
      recipientEmail: input.recipientEmail,
      senderName: input.senderName,
      scheduledDate: input.scheduledDate,
      createdAt: now,
      status: 'pending',
    };

    await this.timeCapsuleRepository.saveTimeCapsule(timeCapsule);

    return timeCapsule;
  }
}

export class TooEarlyToScheduleTimeCapsuleError extends Error {
  constructor() {
    super('Scheduled date must be in the future');
  }
}
