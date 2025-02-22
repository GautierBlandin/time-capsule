import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reset, register } from '@timecapsule/di';
import { timeCapsuleRepositoryToken } from './TimeCapsule.repository.token';
import { FakeTimeCapsuleRepository } from './TimeCapsule.repository.fake';
import { emailServiceFacadeToken } from './EmailService.facade.token';
import { FakeEmailService } from './EmailService.facade.fake';
import { SendEmailUseCase } from './sendEmail.usecase';
import { TimeCapsuleObjectMother } from './TimeCapsule.model.object-mother';

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

    const timeCapsules = [
      TimeCapsuleObjectMother.create('1')
        .withStatus('pending')
        .withSenderName('Gautier')
        .withScheduledDate(new Date('2023-04-15T10:25:00Z'))
        .build(),
      TimeCapsuleObjectMother.create('2')
        .withStatus('pending')
        .withSenderName('Paul')
        .withScheduledDate(new Date('2023-04-15T10:28:00Z'))
        .build(),
      TimeCapsuleObjectMother.create('3')
        .withStatus('sent')
        .withScheduledDate(new Date('2023-04-15T10:29:00Z'))
        .build(),
      TimeCapsuleObjectMother.create('4')
        .withStatus('failed')
        .withScheduledDate(new Date('2021-04-15T10:29:00Z'))
        .build(),
      TimeCapsuleObjectMother.create('5')
        .withStatus('pending')
        .withScheduledDate(new Date('2021-05-15T10:29:00Z'))
        .build(),
    ];

    fakeRepo.setTimeCapsules(timeCapsules);

    await useCase.execute();

    const sentEmails = fakeEmailService.getSentEmails();
    expect(sentEmails).toHaveLength(2);
    expect(sentEmails[0]).toEqual({
      to: timeCapsules[0].recipientEmail,
      subject: 'Gautier sent you a time capsule!',
      body: timeCapsules[0].message,
    });
    expect(sentEmails[1]).toEqual({
      to: timeCapsules[1].recipientEmail,
      subject: 'Paul sent you a time capsule!',
      body: timeCapsules[1].message,
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

    const timeCapsules = [
      TimeCapsuleObjectMother.create('1')
        .withStatus('pending')
        .withScheduledDate(new Date('2023-04-15T10:25:00Z'))
        .build(),
    ];

    fakeRepo.setTimeCapsules(timeCapsules);

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
