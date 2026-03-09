import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-gps',
  imports: [MatButton, MatCard, MatCardContent, MatList, MatListItem],
  templateUrl: './gps.html',
  styleUrls: ['./gps.scss'],
  standalone: true
})
export class Gps implements OnInit, OnDestroy {
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  accuracy = signal<number | null>(null);
  status = signal('Bereit');
  error = signal<string | null>(null);

  private watchId?: number;
  private backendUrl = 'http://localhost:5062/api/leitstelle/receive';
  private lastSent = 0;

  private http = inject(HttpClient);

  startGps() {
    if (!navigator.geolocation) {
      this.status.set('Geolocation wird nicht unterstützt');
      return;
    }

    this.error.set(null);
    this.status.set('Warte auf GPS…');


    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onPositionSuccess(pos),
      (err) => this.onPositionError(err),
      {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 10000
      }
    );
  }

  private onPositionSuccess(pos: GeolocationPosition) {
    this.latitude.set(pos.coords.latitude);
    this.longitude.set(pos.coords.longitude);
    this.accuracy.set(pos.coords.accuracy);
    this.status.set('Standort ermittelt');

    this.sendToBackend();
  }

  private onPositionError(err: GeolocationPositionError) {
    console.warn('Geolocation-Fehler:', err);

    switch (err.code) {
      case err.PERMISSION_DENIED:
        this.error.set('Standortzugriff verweigert');
        this.status.set('Standort konnte nicht ermittelt werden');
        break;
      case err.POSITION_UNAVAILABLE:
        this.error.set('Position nicht verfügbar');
        this.status.set('Erneuter Versuch in 5 Sekunden…');
        this.retryPosition();
        break;
      case err.TIMEOUT:
        this.error.set('Timeout – GPS nicht gefunden');
        this.status.set('Erneuter Versuch in 5 Sekunden…');
        this.retryPosition();
        break;
      default:
        this.error.set('Unbekannter Fehler');
        this.status.set('Erneuter Versuch in 5 Sekunden…');
        this.retryPosition();
        break;
    }
  }

  private retryPosition() {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }

    setTimeout(() => this.startGps(), 5000);
  }

  private sendToBackend() {
    const now = Date.now();
    if (now - this.lastSent < 5000) return;
    this.lastSent = now;

    if (this.latitude() === null || this.longitude() === null) return;

    const payload = {
      userId: 'Angular_Client_1',
      latitude: this.latitude(),
      longitude: this.longitude(),
      accuracy: this.accuracy()
    };

    this.http.post(this.backendUrl, payload).subscribe({
      next: () => this.status.set('GPS-Daten an Leitstelle gesendet'),
      error: (err) => {
        console.error(err);
        this.error.set('Backend nicht erreichbar');
      }
    });
  }

  stopGps() {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
      this.status.set('Standortüberwachung gestoppt');
    }
  }

  // Start GPS automatisch beim Initialisieren der Komponente
  ngOnInit(): void {
    this.startGps();
  }

  // Aufräumen beim Zerstören der Komponente
  ngOnDestroy(): void {
    this.stopGps();
  }
}
