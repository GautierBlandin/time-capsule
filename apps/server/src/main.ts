import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CreateTimeCapsuleUseCase,
  CreateTimeCapsuleInput,
} from '@timecapsule/timecapsule';

const createTimeCapsuleUseCase = new CreateTimeCapsuleUseCase();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const payload: unknown = JSON.parse(event.body);

    if (!isValidPayload(payload)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request payload' }),
      };
    }

    const input: CreateTimeCapsuleInput = {
      message: payload.message,
      recipientEmail: payload.recipientEmail,
      scheduledDate: new Date(payload.scheduledDate),
    };

    const timeCapsule = await createTimeCapsuleUseCase.execute(input);

    return {
      statusCode: 201,
      body: JSON.stringify(timeCapsule),
    };
  } catch (error) {
    console.error('Error creating time capsule:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function isValidPayload(payload: unknown): payload is CreateTimeCapsuleInput {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    'recipientEmail' in payload &&
    typeof payload.recipientEmail === 'string' &&
    'scheduledDate' in payload &&
    typeof payload.scheduledDate === 'string' &&
    !isNaN(Date.parse(payload.scheduledDate))
  );
}
