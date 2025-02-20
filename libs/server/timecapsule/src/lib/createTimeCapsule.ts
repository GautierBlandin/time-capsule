import { EventBus, eventBusToken } from '@timecapsule/eventBus';
import { inject } from '@timecapsule/di';
import { v4 as uuidv4 } from 'uuid';
import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';

export interface CreateTimeCapsuleInput {
  message: string;
  recipientEmail: string;
  scheduledDate: Date;
}

export class CreateTimeCapsuleUseCase {
  private timeCapsuleRepository: TimeCapsuleRepository = inject(timeCapsuleRepositoryToken);
  private eventBus: EventBus = inject(eventBusToken);

  async execute(input: CreateTimeCapsuleInput): Promise<TimeCapsule> {
    const now = new Date();
    const minimumScheduledDate = new Date(now.getTime() + 60000); // 1 minute from now

    if (input.scheduledDate <= minimumScheduledDate) {
      throw new Error('Scheduled date must be at least one minute in the future');
    }

    const timeCapsule: TimeCapsule = {
      id: uuidv4(),
      message: input.message,
      recipientEmail: input.recipientEmail,
      scheduledDate: input.scheduledDate,
      createdAt: now,
      status: 'pending',
    };

    await this.timeCapsuleRepository.saveTimeCapsule(timeCapsule);

    await this.eventBus.publishEvent(
      {
        eventName: 'SEND_TIME_CAPSULE',
        body: { timeCapsuleId: timeCapsule.id },
      },
      { publishAt: timeCapsule.scheduledDate }
    );

    return timeCapsule;
  }
}
