import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-gps',
  imports: [MatButton, MatCard, MatCardContent, MatList, MatListItem],
  templateUrl: './gps.html',
  styleUrls: ['./gps.scss'],
  standalone: true
})
export class Gps implements OnInit, OnDestroy {
  // Signals für die UI
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  accuracy = signal<number | null>(null);
  status = signal('Bereit');
  error = signal<string | null>(null);

  private watchId?: number;
  private lastSent = 0;

  // Services injecten
  private locationService = inject(LocationService);

  ngOnInit(): void {
    this.startGps();
  }

  ngOnDestroy(): void {
    this.stopGps();
  }

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
      case err.TIMEOUT:
      default:
        this.error.set(err.message || 'GPS Fehler');
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
    // Throttle: Nur alle 5 Sekunden senden, um das Netz zu schonen
    if (now - this.lastSent < 5000) return;
    
    const lat = this.latitude();
    const lon = this.longitude();

    if (lat === null || lon === null) return;

    this.lastSent = now;

    const payload = {
      userId: 'Angular_Client_1',
      latitude: lat,
      longitude: lon,
      accuracy: this.accuracy()
    };

    // Nutzt jetzt den zentralen Service (und damit die VM-IP aus der environment)
    this.locationService.sendLocation(payload).subscribe({
      next: () => {
        this.status.set('GPS-Daten an Leitstelle gesendet');
        this.error.set(null);
      },
      error: (err) => {
        console.error('Senden fehlgeschlagen:', err);
        this.error.set('Backend (VM) nicht erreichbar');
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
}