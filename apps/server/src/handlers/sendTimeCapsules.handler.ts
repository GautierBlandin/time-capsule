import { SendEmailUseCase } from '@timecapsule/timecapsule';

const sendEmailUseCase = new SendEmailUseCase();

export const handler = async (): Promise<void> => {
  await sendEmailUseCase.execute();
};
