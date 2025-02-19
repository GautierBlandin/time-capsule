import { TimeCapsule } from './TimeCapsule.model';

export interface TimeCapsuleRepository {
  saveTimeCapsule(timeCapsule: TimeCapsule): Promise<void>;
}
