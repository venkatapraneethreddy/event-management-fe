import { Event } from './event.model';

export interface Registration {
  registrationId: number;
  registeredAt: string;
  qrCode: string;
  event: Event;
}