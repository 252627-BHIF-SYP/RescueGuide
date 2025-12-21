import { Component, signal } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatList,
    MatListItem,
    MatButton
  ]
})
export class App {

  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  accuracy = signal<number | null>(null);
  status = signal('Standort wird gesucht...');
  error = signal<string | null>(null);

  private watchId?: number;

  startGps() {
    if (!navigator.geolocation) {
      this.status.set('Geolocation wird nicht unterstützt');
      return;
    }

    this.status.set('Suche nach Standort (Wi-Fi)…');

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.latitude.set(pos.coords.latitude);
        this.longitude.set(pos.coords.longitude);
        this.accuracy.set(pos.coords.accuracy);
        this.status.set(`Standort fixiert (Wi-Fi, Genauigkeit: ${Math.round(pos.coords.accuracy)} m)`);
        this.error.set(null);
      },
      (err) => {
        this.error.set(err.message);
        this.status.set('Fehler bei der Standortbestimmung');
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  stopGps() {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.status.set('Standortsuche gestoppt');
    }
  }
}
