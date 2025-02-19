import { TimeCapsuleRepository } from './TimeCapsule.repository';
import { TimeCapsule } from './TimeCapsule.model';

export class FakeTimeCapsuleRepository implements TimeCapsuleRepository {
  private timeCapsules: Map<string, TimeCapsule> = new Map();

  async saveTimeCapsule(timeCapsule: TimeCapsule): Promise<void> {
    this.timeCapsules.set(timeCapsule.id, timeCapsule);
  }

  // Additional methods for testing purposes
  async getTimeCapsuleById(id: string): Promise<TimeCapsule | undefined> {
    return this.timeCapsules.get(id);
  }

  async getAllTimeCapsules(): Promise<TimeCapsule[]> {
    return Array.from(this.timeCapsules.values());
  }

  async clearAllTimeCapsules(): Promise<void> {
    this.timeCapsules.clear();
  }
}
