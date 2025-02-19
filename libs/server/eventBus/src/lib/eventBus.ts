import { Event } from './event.model';

export interface EventBusOptions {
  publishAt?: Date;
}

export interface EventBus {
  publishEvent<EventName extends string, EventBody>(
    event: Event<EventName, EventBody>,
    options?: EventBusOptions
  ): Promise<void>;
}
