import { EventBus, EventBusOptions } from './eventBus';
import { Event } from './event.model';

export class FakeEventBus implements EventBus {
  private publishedEvents: Array<{
    event: Event<string, unknown>;
    options?: EventBusOptions;
  }> = [];

  async publishEvent<EventName extends string, EventBody>(
    event: Event<EventName, EventBody>,
    options?: EventBusOptions
  ): Promise<void> {
    this.publishedEvents.push({ event, options });
    return Promise.resolve();
  }

  getPublishedEvents(): Array<{
    event: Event<string, unknown>;
    options?: EventBusOptions;
  }> {
    return [...this.publishedEvents];
  }
}
