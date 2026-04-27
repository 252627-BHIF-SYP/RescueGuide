import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

export interface EmergencyProtocol {
  type: string;
  callerName: string;
  callerType: string;
  callbackNumber: string;
  address: string;
  injuredCount: string | number;
  description: string;
  dispatcherName: string;
  date: string;
  time: string;
  alarmedRD: boolean;
  alarmedNA: boolean;
  alarmedPol: boolean;
  alarmedFW: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmergencyService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly backendUrl = 'http://localhost:5062/api/leitstelle/all';
  
  // State Signals
  protocol = signal<EmergencyProtocol>(this.getDefaultProtocol());
  durationSeconds = signal<number>(0);
  currentLocation = signal<Notruf | null>(null);

  private timerInterval: any;

  constructor() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private getDefaultProtocol(): EmergencyProtocol {
    const now = new Date();
    return {
      type: '',
      callerName: '',
      callerType: '',
      callbackNumber: '',
      address: '',
      injuredCount: '',
      description: '',
      dispatcherName: this.auth.userName() || '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      alarmedRD: false,
      alarmedNA: false,
      alarmedPol: false,
      alarmedFW: false
    };
  }

  updateProtocol(data: Partial<EmergencyProtocol>) {
    this.protocol.update(p => ({ ...p, ...data }));
  }

  startTimer() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.durationSeconds.update(s => s + 1);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  resetTimer() {
    this.durationSeconds.set(0);
  }

  fetchLocation() {
    this.http.get<Notruf[]>(this.backendUrl).subscribe({
      next: (notrufe) => {
        if (notrufe && notrufe.length > 0) {
          this.currentLocation.set(notrufe[notrufe.length - 1]);
        } else {
          this.currentLocation.set(null);
        }
      },
      error: (err) => {
        console.error('Fehler beim Laden der Notrufe', err);
      }
    });
  }
}
