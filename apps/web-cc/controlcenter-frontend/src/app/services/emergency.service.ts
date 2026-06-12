import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

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

  
  // State Signals
  isActive = signal<boolean>(false);
  protocol = signal<EmergencyProtocol>(this.getDefaultProtocol());
  durationSeconds = signal<number>(0);
  activeEmergencyId = signal<number | null>(null);

  private timerInterval: any;

  constructor() {}

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
      dispatcherName: '',
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

  createEmergency() {
    // Create an empty emergency
    const emergencyPayload = {
      startedAt: new Date().toISOString(),
      status: 0 // e.g. 0 = Active, adapt to your EmergencyStatus enum
    };
    this.http.post<any>(`${environment.apiUrl}/Emergency`, emergencyPayload)
      .subscribe({
        next: (res) => {
          this.activeEmergencyId.set(res.id);
          console.log('Emergency created with ID:', res.id);
        },
        error: (err) => console.error('Error creating emergency', err)
      });
  }

  saveProtocol() {
    const emergencyId = this.activeEmergencyId();
    if (!emergencyId) {
      console.error('Cannot save protocol: No active emergency ID');
      return;
    }

    const payload = {
      emergencyId: emergencyId,
      ...this.protocol()
    };

    this.http.post(`${environment.apiUrl}/EmergencyProtocol`, payload)
      .subscribe({
        next: () => console.log('Protocol saved successfully'),
        error: (err) => console.error('Error saving protocol', err)
      });
  }

  endEmergency() {
    const emergencyId = this.activeEmergencyId();
    if (emergencyId) {
      const emergencyPayload = {
        id: emergencyId,
        endedAt: new Date().toISOString(),
        status: 1 // e.g. 1 = Ended
      };
      this.http.put(`${environment.apiUrl}/Emergency/${emergencyId}`, emergencyPayload)
        .subscribe({
          next: () => console.log('Emergency ended in backend'),
          error: (err) => console.error('Error ending emergency', err)
        });
    }
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
}
