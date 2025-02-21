import { EmailServiceFacade } from './EmailService.facade';
import * as sgMail from '@sendgrid/mail';

export class SendGridEmailService implements EmailServiceFacade {
  private readonly sender = 'noreply@timecapsules.gautierblandin.com';

  constructor() {
    const apiKey = process.env['SENDGRID_API_KEY'];
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> {
    const msg = {
      to,
      from: this.sender,
      subject,
      text: body,
    };

    try {
      await sgMail.send(msg);
    } catch (error) {
      throw new Error('Failed to send email');
    }
  }
}
