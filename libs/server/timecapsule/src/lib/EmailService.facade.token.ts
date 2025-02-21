import { createInjectionToken } from '@timecapsule/di';
import { EmailServiceFacade } from './EmailService.facade';
import { SendGridEmailService } from './EmailService.facade.sendgrid';

export const emailServiceFacadeToken = createInjectionToken<EmailServiceFacade>(
  'emailServiceFacade',
  {
    useClass: SendGridEmailService,
  }
);
