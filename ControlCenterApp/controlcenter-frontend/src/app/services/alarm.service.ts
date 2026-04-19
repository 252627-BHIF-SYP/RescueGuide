import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface AlarmData {
  id: string;
  location: string;
  caller: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlarmService {
  // Ein Stream, der neue Alarme verteilt
  private alarmSource = new Subject<AlarmData>();
  alarmStream$ = this.alarmSource.asObservable();

  constructor() {}

  // Diese Methode kannst du später per Websocket oder Polling aufrufen
  triggerMockAlarm() {
    this.alarmSource.next({
      id: 'AL-99',
      location: 'Hauptstraße 12, 80331 München',
      caller: 'Max Mustermann',
      type: 'Brandmelder (BMA)'
    });
  }
}