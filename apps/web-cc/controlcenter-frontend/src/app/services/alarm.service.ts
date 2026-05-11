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
  private alarmSource = new Subject<AlarmData>();
  alarmStream$ = this.alarmSource.asObservable();

  constructor() {}

  triggerMockAlarm() {
    this.alarmSource.next({
      id: 'AL-99',
      location: 'test',
      caller: 'test',
      type: 'test'
    });
  }
}
