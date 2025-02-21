import { EmailServiceFacade } from './EmailService.facade';

export class FakeEmailService implements EmailServiceFacade {
  private sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    console.log(`Fake email sent to ${to} with subject: ${subject}`);
    this.sentEmails.push({ to, subject, body });
  }

  getSentEmails(): Array<{ to: string; subject: string; body: string }> {
    return this.sentEmails;
  }
}
