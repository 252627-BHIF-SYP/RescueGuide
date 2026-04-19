import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer, Subscription } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
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
  injuredCount: string;
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
export class EmergencyService {
  private readonly backendUrl = 'http://localhost:5062/api/leitstelle/all';
  
  // Einsatzprotokoll Status
  private readonly _protocol$ = new BehaviorSubject<EmergencyProtocol>(this.getDefaultProtocol());
  public readonly protocol$ = this._protocol$.asObservable();

  // Einsatzdauer Status
  private readonly _durationSeconds$ = new BehaviorSubject<number>(0);
  public readonly durationSeconds$ = this._durationSeconds$.asObservable();
  private timerSubscription?: Subscription;

  // Standort Status
  private readonly _currentLocation$ = new BehaviorSubject<Notruf | null>(null);
  public readonly currentLocation$ = this._currentLocation$.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {
    this.startTimer();
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

  // Protokoll aktualisieren
  updateProtocol(data: Partial<EmergencyProtocol>) {
    this._protocol$.next({ ...this._protocol$.getValue(), ...data });
  }

  get currentProtocol(): EmergencyProtocol {
    return this._protocol$.getValue();
  }

  // Timer Logik
  private startTimer() {
    this.timerSubscription = timer(0, 1000).subscribe(() => {
      this._durationSeconds$.next(this._durationSeconds$.getValue() + 1);
    });
  }

  resetTimer() {
    this._durationSeconds$.next(0);
  }

  // Standort Abfrage (Polling)
  fetchLocation(): Observable<Notruf | null> {
    return this.http.get<Notruf[]>(this.backendUrl).pipe(
      map(notrufe => (notrufe && notrufe.length > 0) ? notrufe[notrufe.length - 1] : null),
      tap(location => this._currentLocation$.next(location))
    );
  }

  /**
   * Startet ein automatisches Polling für den Standort
   */
  startLocationPolling(intervalMs: number = 5000): Observable<Notruf | null> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.fetchLocation())
    );
  }
}
