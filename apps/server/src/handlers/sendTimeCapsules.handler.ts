import { SendEmailUseCase } from '@timecapsule/server/timecapsule';

const sendEmailUseCase = new SendEmailUseCase();

export const handler = async (): Promise<void> => {
  await sendEmailUseCase.execute();
};
