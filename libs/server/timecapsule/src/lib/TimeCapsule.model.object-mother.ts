import { TimeCapsule } from './TimeCapsule.model';

export class TimeCapsuleObjectMother {
  private timeCapsule: TimeCapsule;

  static create(id: string) {
    return new TimeCapsuleObjectMother({
      id,
      message: 'Test message',
      recipientEmail: 'test@example.com',
      senderName: 'Test Sender',
      scheduledDate: new Date(new Date(new Date().getTime() + 120000)),
      createdAt: new Date(),
      status: 'pending',
    });
  }

  build(): TimeCapsule {
    return this.timeCapsule;
  }

  withMessage(message: string): TimeCapsuleObjectMother {
    this.timeCapsule.message = message;
    return this;
  }

  withRecipientEmail(recipientEmail: string): TimeCapsuleObjectMother {
    this.timeCapsule.recipientEmail = recipientEmail;
    return this;
  }

  withScheduledDate(scheduledDate: Date): TimeCapsuleObjectMother {
    this.timeCapsule.scheduledDate = scheduledDate;
    return this;
  }

  withSenderName(senderName: string): TimeCapsuleObjectMother {
    this.timeCapsule.senderName = senderName;
    return this;
  }

  withCreatedAt(createdAt: Date): TimeCapsuleObjectMother {
    this.timeCapsule.createdAt = createdAt;
    return this;
  }

  withStatus(status: 'pending' | 'sent' | 'failed'): TimeCapsuleObjectMother {
    this.timeCapsule.status = status;
    return this;
  }

  private constructor(timeCapsule: TimeCapsule) {
    this.timeCapsule = timeCapsule;
  }
}
