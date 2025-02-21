import { createInjectionToken } from '@timecapsule/di';
import { EmailServiceFacade } from './EmailService.facade';
import { FakeEmailService } from './EmailService.facade.fake';

export const emailServiceFacadeToken = createInjectionToken<EmailServiceFacade>(
  'emailServiceFacade',
  {
    useClass: FakeEmailService,
  }
);
