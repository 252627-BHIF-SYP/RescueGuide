import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalingService } from './signaling.service';

export interface AlarmData {
  id: string;
  type: string;
  location: string;
  caller: string;
  lat?: number;
  lng?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlarmService {
  private signaling = inject(SignalingService);

  // BehaviorSubject hält den aktuellsten Alarm-Zustand (wichtig für Echtzeit-Updates)
  private alarmSubject = new BehaviorSubject<AlarmData | null>(null);
  public alarmStream$ = this.alarmSubject.asObservable();

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    // 1. Initialer Notruf kommt rein (aus _startCall der Mobile-App)
    this.signaling.on('call-request', (data: any) => {
      const metadata = data.metadata || {};
      const loc = metadata.location || {};

      this.alarmSubject.next({
        id: data.from,
        type: metadata.type === 'emergency' ? 'Notfall (App)' : 'Unbekannt',
        location: loc.address || 'Standort wird ermittelt...',
        caller: data.from,
        lat: loc.latitude,
        lng: loc.longitude
      });
    });

    // 2. Nachträgliches Standort-Update (aus setLocation der Mobile-App)
    this.signaling.on('location-update', (data: any) => {
      const currentAlarm = this.alarmSubject.value;
      // Das Popup nur updaten, wenn das Update zum aktuellen Anrufer gehört
      if (currentAlarm && currentAlarm.id === data.from && data.location) {
        this.alarmSubject.next({
          ...currentAlarm,
          location: data.location.address || currentAlarm.location,
          lat: data.location.latitude,
          lng: data.location.longitude
        });
      }
    });

    // 3. (Optional) Wenn der Anrufer in der App auflegt, bevor man rangeht, Popup schließen
    this.signaling.on('call-end', () => {
      this.clearAlarm();
    });
  }

  clearAlarm() {
    this.alarmSubject.next(null);
  }
}
