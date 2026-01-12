import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatList, MatListItem } from '@angular/material/list';
import {VideoCall} from './video-call/video-call';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatButton,
    MatList,
    MatListItem,
    VideoCall
  ]
})
export class App {

  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  accuracy = signal<number | null>(null);
  status = signal('Bereit');
  error = signal<string | null>(null);

  private watchId?: number;
  private backendUrl = 'http://localhost:5062/api/leitstelle/receive';
  private lastSent = 0;

  constructor(private http: HttpClient) {}

  startGps() {
    if (!navigator.geolocation) {
      this.status.set('Geolocation wird nicht unterstützt');
      return;
    }

    this.error.set(null);
    this.status.set('Warte auf Standortfreigabe…');

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
        this.accuracy.set(pos.coords.accuracy);

        this.status.set('Standort ermittelt');

        this.sendToBackend();
      },
      (err) => {
        console.error('Geolocation error:', err);
        this.error.set(`${err.code}: ${err.message}`);
        this.status.set('Standort konnte nicht ermittelt werden');
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }

  sendToBackend() {
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
      next: () => {
        this.status.set('GPS-Daten an Leitstelle gesendet');
      },
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
}
