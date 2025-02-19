import { Event } from './event.model';

export interface EventBus {
  publishEvent<EventName extends string, EventBody>(event: Event<EventName, EventBody>): Promise<void>;
}
