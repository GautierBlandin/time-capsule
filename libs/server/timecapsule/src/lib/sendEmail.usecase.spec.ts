import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reset, register } from '@timecapsule/di';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';
import { FakeTimeCapsuleRepository } from './TimeCapsule.repository.fake';
import { emailServiceFacadeToken } from './EmailService.facade.token';
import { FakeEmailService } from './EmailService.facade.fake';
import { SendEmailUseCase } from './sendEmail.usecase';
import { TimeCapsule } from './TimeCapsule.model';

function setup() {
  reset();
  const fakeRepo = new FakeTimeCapsuleRepository();
  const fakeEmailService = new FakeEmailService();

  register(timeCapsuleRepositoryToken, { useValue: fakeRepo });
  register(emailServiceFacadeToken, { useValue: fakeEmailService });

  const useCase = new SendEmailUseCase();

  return { fakeRepo, fakeEmailService, useCase };
}

describe('SendEmailUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should send pending time capsules and update their status', async () => {
    const { fakeRepo, fakeEmailService, useCase } = setup();
    const now = new Date('2023-04-15T10:30:00Z');
    vi.setSystemTime(now);

    const timeCapsules: TimeCapsule[] = [
      {
        id: '1',
        message: 'Test message 1',
        recipientEmail: 'test1@example.com',
        scheduledDate: new Date('2023-04-15T10:25:00Z'),
        createdAt: new Date('2023-04-15T10:20:00Z'),
        status: 'pending',
      },
      {
        id: '2',
        message: 'Test message 2',
        recipientEmail: 'test2@example.com',
        scheduledDate: new Date('2023-04-15T10:28:00Z'),
        createdAt: new Date('2023-04-15T10:23:00Z'),
        status: 'pending',
      },
      {
        id: '3',
        message: 'Test message 3',
        recipientEmail: 'test3@example.com',
        scheduledDate: new Date('2023-04-15T10:29:00Z'),
        createdAt: new Date('2023-04-15T10:24:00Z'),
        status: 'sent',
      },
      {
        id: '4',
        message: 'Test message 3',
        recipientEmail: 'test3@example.com',
        scheduledDate: new Date('2021-04-15T10:29:00Z'),
        createdAt: new Date('2020-04-15T10:24:00Z'),
        status: 'failed',
      },
    ];

    fakeRepo.setTimeCapsules(timeCapsules);

    await useCase.execute();

    const sentEmails = fakeEmailService.getSentEmails();
    expect(sentEmails).toHaveLength(2);
    expect(sentEmails[0]).toEqual({
      to: 'test1@example.com',
      subject: 'A Time Capsule has been sent to you !',
      body: 'Test message 1',
    });
    expect(sentEmails[1]).toEqual({
      to: 'test2@example.com',
      subject: 'A Time Capsule has been sent to you !',
      body: 'Test message 2',
    });

    const updatedTimeCapsules = await fakeRepo.getTimeCapsulesBetweenDates(
      new Date('2023-04-15T10:20:00Z'),
      now
    );
    expect(updatedTimeCapsules[0].status).toBe('sent');
    expect(updatedTimeCapsules[1].status).toBe('sent');
    expect(updatedTimeCapsules[2].status).toBe('sent');
  });

  it('should handle email sending failures', async () => {
    const { fakeRepo, fakeEmailService, useCase } = setup();
    const now = new Date('2023-04-15T10:30:00Z');
    vi.setSystemTime(now);

    const timeCapsules: TimeCapsule[] = [
      {
        id: '1',
        message: 'Test message 1',
        recipientEmail: 'test1@example.com',
        scheduledDate: new Date('2023-04-15T10:25:00Z'),
        createdAt: new Date('2023-04-15T10:20:00Z'),
        status: 'pending',
      },
    ];

    fakeRepo.setTimeCapsules(timeCapsules);

    // Mock email service to throw an error
    fakeEmailService.sendEmail = vi
      .fn()
      .mockRejectedValue(new Error('Email sending failed'));

    await useCase.execute();

    const sentEmails = fakeEmailService.getSentEmails();
    expect(sentEmails).toHaveLength(0);

    const updatedTimeCapsules = await fakeRepo.getTimeCapsulesBetweenDates(
      new Date('2023-04-15T10:20:00Z'),
      now
    );
    expect(updatedTimeCapsules[0].status).toBe('failed');
  });
});
