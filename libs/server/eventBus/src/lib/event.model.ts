export type Event<EventName extends string, EventBody> = {
  eventName: EventName;
  body: EventBody
};
