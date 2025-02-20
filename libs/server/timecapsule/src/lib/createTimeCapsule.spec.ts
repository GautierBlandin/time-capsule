import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reset, register } from '@timecapsule/di';
import { eventBusToken } from '@timecapsule/eventBus';
import { FakeEventBus } from '@timecapsule/eventBus';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';
import { FakeTimeCapsuleRepository } from './TimeCapsule.repository.fake';
import { CreateTimeCapsuleUseCase, CreateTimeCapsuleInput } from './createTimeCapsule';

function setup() {
  reset();
  const fakeRepo = new FakeTimeCapsuleRepository();
  const fakeEventBus = new FakeEventBus();

  register(timeCapsuleRepositoryToken, { useValue: fakeRepo });
  register(eventBusToken, { useValue: fakeEventBus });

  const useCase = new CreateTimeCapsuleUseCase();

  return { fakeRepo, fakeEventBus, useCase };
}

describe('CreateTimeCapsuleUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should create a time capsule and save it to the repository', async () => {
    const { fakeRepo, useCase } = setup();
    const input: CreateTimeCapsuleInput = {
      message: 'Test message',
      recipientEmail: 'test@example.com',
      scheduledDate: new Date('2023-05-01T12:00:00Z'),
    };

    const result = await useCase.execute(input);

    expect(result).toMatchObject({
      message: input.message,
      recipientEmail: input.recipientEmail,
      scheduledDate: input.scheduledDate,
      status: 'pending',
    });

    const savedTimeCapsule = await fakeRepo.getTimeCapsuleById(result.id);
    expect(savedTimeCapsule).toEqual(result);
  });

  it('should publish an event to the event bus', async () => {
    const { fakeEventBus, useCase } = setup();
    const input: CreateTimeCapsuleInput = {
      message: 'Test message',
      recipientEmail: 'test@example.com',
      scheduledDate: new Date('2023-05-01T12:00:00Z'),
    };

    const result = await useCase.execute(input);

    const publishedEvents = fakeEventBus.getPublishedEvents();
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toMatchObject({
      event: {
        eventName: 'SEND_TIME_CAPSULE',
        body: { timeCapsuleId: result.id },
      },
      options: {
        publishAt: input.scheduledDate,
      },
    });
  });

  it('should generate a unique ID for each time capsule', async () => {
    const { useCase } = setup();
    const input: CreateTimeCapsuleInput = {
      message: 'Test message',
      recipientEmail: 'test@example.com',
      scheduledDate: new Date('2023-05-01T12:00:00Z'),
    };

    const result1 = await useCase.execute(input);
    const result2 = await useCase.execute(input);

    expect(result1.id).not.toEqual(result2.id);
  });

  it('should set the correct creation date', async () => {
    const { useCase } = setup();
    const input: CreateTimeCapsuleInput = {
      message: 'Test message',
      recipientEmail: 'test@example.com',
      scheduledDate: new Date('2023-05-01T12:00:00Z'),
    };

    const fakeNow = new Date('2023-04-15T10:30:00Z');
    vi.setSystemTime(fakeNow);

    const result = await useCase.execute(input);

    expect(result.createdAt).toEqual(fakeNow);
  });
});
