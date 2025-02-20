import { TimeCapsule } from './TimeCapsule.model';

export interface TimeCapsuleRepository {
  saveTimeCapsule(timeCapsule: TimeCapsule): Promise<void>;
  getTimeCapsuleById(id: string): Promise<TimeCapsule | null>;
  getTimeCapsulesBetweenDates(
    startDate: Date,
    endDate: Date
  ): Promise<TimeCapsule[]>;
}
