import { Injectable, signal } from '@angular/core';

export type EmergencyStatus =
  | 'idle'
  | 'holding'
  | 'connecting'
  | 'connected';

@Injectable({ providedIn: 'root' })
export class EmergencyStateService {

  status = signal<EmergencyStatus>('idle');
  holdProgress = signal(0);

  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);

  reset() {
    this.status.set('idle');
    this.holdProgress.set(0);
  }
}
