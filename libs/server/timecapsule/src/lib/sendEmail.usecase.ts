import { inject } from '@timecapsule/di';
import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';
import { EmailServiceFacade } from './EmailService.facade';
import { emailServiceFacadeToken } from './EmailService.facade.token';
import { TimeCapsule } from './TimeCapsule.model';

export class SendEmailUseCase {
  private timeCapsuleRepository: TimeCapsuleRepository = inject(
    timeCapsuleRepositoryToken
  );
  private emailService: EmailServiceFacade = inject(emailServiceFacadeToken);

  async execute(): Promise<void> {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const timeCapsules =
      await this.timeCapsuleRepository.getTimeCapsulesBetweenDates(
        tenMinutesAgo,
        now
      );

    const pendingTimeCapsules = timeCapsules.filter(
      (tc) => tc.status === 'pending'
    );

    for (const timeCapsule of pendingTimeCapsules) {
      await this.sendTimeCapsule(timeCapsule);
    }
  }

  private async sendTimeCapsule(timeCapsule: TimeCapsule): Promise<void> {
    try {
      await this.emailService.sendEmail({
        to: timeCapsule.recipientEmail,
        subject: `${timeCapsule.senderName} sent you a time capsule!`,
        body: timeCapsule.message,
      });

      timeCapsule.status = 'sent';
      await this.timeCapsuleRepository.saveTimeCapsule(timeCapsule);
    } catch (error) {
      console.log('Failed to send email:', error);
      timeCapsule.status = 'failed';
      await this.timeCapsuleRepository.saveTimeCapsule(timeCapsule);
    }
  }
}
