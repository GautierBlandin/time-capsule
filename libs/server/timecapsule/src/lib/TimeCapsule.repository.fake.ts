import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';

export class FakeTimeCapsuleRepository implements TimeCapsuleRepository {
  private timeCapsules: Map<string, TimeCapsule> = new Map();

  async saveTimeCapsule(timeCapsule: TimeCapsule): Promise<void> {
    this.timeCapsules.set(timeCapsule.id, timeCapsule);
  }

  async getTimeCapsuleById(id: string): Promise<TimeCapsule | null> {
    return this.timeCapsules.get(id) || null;
  }

  async getTimeCapsulesBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<TimeCapsule[]> {
    return Array.from(this.timeCapsules.values()).filter(
      (tc) => tc.scheduledDate >= startDate && tc.scheduledDate <= endDate
    );
  }

  // Additional methods for testing purposes
  async getAllTimeCapsules(): Promise<TimeCapsule[]> {
    return Array.from(this.timeCapsules.values());
  }

  setTimeCapsules(timeCapsules: TimeCapsule[]): void {
    this.timeCapsules = new Map(timeCapsules.map((tc) => [tc.id, tc]));
  }

  async clearAllTimeCapsules(): Promise<void> {
    this.timeCapsules.clear();
  }
}
