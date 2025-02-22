import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CreateTimeCapsuleUseCase,
  CreateTimeCapsuleInput,
  TooEarlyToScheduleTimeCapsuleError,
} from '@timecapsule/server/timecapsule';
import { z } from 'zod';

const CreateTimeCapsuleSchema = z.object({
  message: z.string(),
  recipientEmail: z.string().email(),
  scheduledDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  senderName: z.string(),
});

const createTimeCapsuleUseCase = new CreateTimeCapsuleUseCase();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      body: '',
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    let decodedBody: string;
    if (event.isBase64Encoded) {
      decodedBody = Buffer.from(event.body, 'base64').toString('utf-8');
    } else {
      decodedBody = event.body;
    }

    const payload: unknown = JSON.parse(decodedBody);

    const result = CreateTimeCapsuleSchema.safeParse(payload);

    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request payload',
          details: result.error.format(),
        }),
      };
    }

    const input: CreateTimeCapsuleInput = {
      message: result.data.message,
      recipientEmail: result.data.recipientEmail,
      scheduledDate: new Date(result.data.scheduledDate),
      senderName: result.data.senderName,
    };

    const timeCapsule = await createTimeCapsuleUseCase.execute(input);

    return {
      statusCode: 201,
      body: JSON.stringify(timeCapsule),
    };
  } catch (error) {
    if (error instanceof TooEarlyToScheduleTimeCapsuleError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "We can't send time capsules in the past (yet)!",
        }),
      };
    }

    console.error('Error creating time capsule:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
