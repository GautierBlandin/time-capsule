import { CreateTimeCapsuleInput } from './createTimeCapsule.usecase';

export class CreateTimeCapsuleInputObjectMother {
  private readonly input: CreateTimeCapsuleInput;

  static create() {
    return new CreateTimeCapsuleInputObjectMother({
      message: 'Test message',
      recipientEmail: 'test@example.com',
      senderName: 'Test Sender',
      scheduledDate: new Date(new Date().getTime() + 120000),
    });
  }

  build(): CreateTimeCapsuleInput {
    return this.input;
  }

  withMessage(message: string): CreateTimeCapsuleInputObjectMother {
    this.input.message = message;
    return this;
  }

  withRecipientEmail(
    recipientEmail: string
  ): CreateTimeCapsuleInputObjectMother {
    this.input.recipientEmail = recipientEmail;
    return this;
  }

  withScheduledDate(scheduledDate: Date): CreateTimeCapsuleInputObjectMother {
    this.input.scheduledDate = scheduledDate;
    return this;
  }

  withSenderName(senderName: string): CreateTimeCapsuleInputObjectMother {
    this.input.senderName = senderName;
    return this;
  }

  private constructor(input: CreateTimeCapsuleInput) {
    this.input = input;
  }
}
