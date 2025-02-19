import { createInjectionToken } from '@timecapsule/di';
import { EventBus } from './eventBus';

export const eventBusToken = createInjectionToken<EventBus>('eventBusToken');
