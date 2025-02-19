import { EventBus } from './eventBus';
import { Event } from './event.model';

export class FakeEventBus implements EventBus {
  private publishedEvents: Event<string, unknown>[] = [];

  async publishEvent<EventName extends string, EventBody>(event: Event<EventName, EventBody>): Promise<void> {
    this.publishedEvents.push(event);
    return Promise.resolve();
  }

  getPublishedEvents(): Event<string, unknown>[] {
    return [...this.publishedEvents];
  }
}
