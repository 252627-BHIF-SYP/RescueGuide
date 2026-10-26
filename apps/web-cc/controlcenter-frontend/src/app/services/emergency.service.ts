import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { Subject, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

export interface EmergencyProtocol {
  id?: number;
  emergencyId?: number;
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
  providedIn: 'root',
})
export class EmergencyService implements OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // State Signals
  isActive = signal<boolean>(false);
  protocol = signal<EmergencyProtocol>(this.getDefaultProtocol());
  durationSeconds = signal<number>(0);
  activeEmergencyId = signal<number | null>(null);
  activeProtocolId = signal<number | null>(null);
  activeCallerId = signal<string | null>(null);
  currentLocation = signal<Notruf | null>(null);

  private timerInterval: any;
  private saveSubject = new Subject<void>();

  constructor() {
    this.saveSubject.pipe(debounceTime(1000)).subscribe(() => {
      this.executeSaveProtocol();
    });
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
      dispatcherName: '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      alarmedRD: false,
      alarmedNA: false,
      alarmedPol: false,
      alarmedFW: false,
    };
  }

  updateProtocol(data: Partial<EmergencyProtocol>) {
    this.protocol.update((p) => ({ ...p, ...data }));
    this.saveProtocol();
  }

  setActiveCallerLocation(callerId: string, latitude?: number, longitude?: number) {
    this.activeCallerId.set(callerId);
    this.currentLocation.set(
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { userId: callerId, latitude: latitude!, longitude: longitude! }
        : null,
    );
  }

  updateActiveCallerLocation(callerId: string, latitude: number, longitude: number) {
    if (this.activeCallerId() !== callerId) return;
    this.currentLocation.set({ userId: callerId, latitude, longitude });
  }

  async createEmergency(initialData?: Partial<EmergencyProtocol>) {
    const protocolInitialData = {
      ...initialData,
      dispatcherName: initialData?.dispatcherName?.trim() || this.auth.userName()?.trim() || '',
    };
    this.protocol.set({ ...this.getDefaultProtocol(), ...protocolInitialData });

    // Create an empty emergency
    const emergencyPayload = {
      startedAt: new Date().toISOString(),
      status: 0, // e.g. 0 = Active, adapt to your EmergencyStatus enum
    };

    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/Emergency`, emergencyPayload),
      );
      this.activeEmergencyId.set(res.id);
      if (res.protocol) {
        this.activeProtocolId.set(res.protocol.id);
        this.protocol.set({
          ...this.getDefaultProtocol(),
          ...res.protocol,
          ...protocolInitialData,
        });
      }
      console.log('Emergency created with ID:', res.id);
      this.saveProtocol();
    } catch (err) {
      console.error('Error creating emergency', err);
    }
  }

  saveProtocol() {
    this.saveSubject.next();
  }

  executeSaveProtocol() {
    const protocolId = this.activeProtocolId();
    if (!protocolId) {
      console.error('Cannot save protocol: No active protocol ID');
      return;
    }

    const payload = {
      ...this.protocol(),
    };

    this.http.put(`${environment.apiUrl}/EmergencyProtocol/${protocolId}`, payload).subscribe({
      next: () => console.log('Protocol saved successfully'),
      error: (err) => console.error('Error saving protocol', err),
    });
  }

  getProtocolByEmergencyId(emergencyId: number) {
    return this.http.get<EmergencyProtocol>(
      `${environment.apiUrl}/EmergencyProtocol/ByEmergency/${emergencyId}`,
    );
  }

  saveProtocolById(protocolId: number, data: Partial<EmergencyProtocol>) {
    return this.http.put(`${environment.apiUrl}/EmergencyProtocol/${protocolId}`, data);
  }

  endEmergency(keepSessionForReview = false) {
    this.executeSaveProtocol();
    const emergencyId = this.activeEmergencyId();
    if (emergencyId) {
      this.http.put(`${environment.apiUrl}/Emergency/${emergencyId}/close`, {}).subscribe({
        next: () => console.log('Emergency ended in backend'),
        error: (err) => console.error('Error ending emergency', err),
      });
    }
    this.isActive.set(false);
    this.activeCallerId.set(null);
    this.currentLocation.set(null);
    this.stopTimer();

    if (!keepSessionForReview) {
      this.clearActiveEmergency();
    }
  }

  clearActiveEmergency() {
    this.activeEmergencyId.set(null);
    this.activeProtocolId.set(null);
    this.activeCallerId.set(null);
    this.currentLocation.set(null);
    this.protocol.set(this.getDefaultProtocol());
    this.stopTimer();
    this.resetTimer();
  }

  startTimer() {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.durationSeconds.update((s) => s + 1);
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
