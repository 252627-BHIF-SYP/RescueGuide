import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SignalingService } from './signaling.service';
import { EmergencyService } from './emergency.service';

export interface AlarmData {
  id: string;
  type: string;
  location: string;
  latitude?: number;
  longitude?: number;
  caller: string;
  lat?: number;
  lng?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlarmService {
  private signaling = inject(SignalingService);
  private emergencyService = inject(EmergencyService);

  // BehaviorSubject hält den aktuellsten Alarm-Zustand (wichtig für Echtzeit-Updates)
  private alarmSubject = new BehaviorSubject<AlarmData | null>(null);
  public alarmStream$ = this.alarmSubject.asObservable();

  constructor() {
    this.initListeners();
  }

  private initListeners() {
    const handleIncomingCall = (data: any) => {
      const metadata = data.metadata || {};
      const loc = metadata.location || {};

      this.alarmSubject.next({
        id: data.from,
        type: metadata.type === 'emergency' ? 'Notfall (App)' : 'Unbekannt',
        location: loc.address || 'Standort wird ermittelt...',
        caller: data.from,
        lat: loc.latitude,
        lng: loc.longitude,
      });
    };
    this.signaling.on('call-request', handleIncomingCall);
    this.signaling.on('incoming-call', handleIncomingCall);

    this.signaling.on('location-update', (data: any) => {
      const currentAlarm = this.alarmSubject.value;
      const latitude = data.location?.latitude;
      const longitude = data.location?.longitude;
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        this.emergencyService.updateActiveCallerLocation(data.from, latitude, longitude);
      }
      // Das Popup nur updaten, wenn das Update zum aktuellen Anrufer gehört
      if (currentAlarm && currentAlarm.id === data.from && data.location) {
        this.alarmSubject.next({
          ...currentAlarm,
          location: data.location.address || currentAlarm.location,
          lat: data.location.latitude,
          lng: data.location.longitude,
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
