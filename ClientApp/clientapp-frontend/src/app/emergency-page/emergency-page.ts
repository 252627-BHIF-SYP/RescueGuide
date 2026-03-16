import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { Navbar } from '../navbar/navbar';
import { LocationService } from '../services/location.service';

@Component({
  selector: 'app-emergency-page',
  templateUrl: './emergency-page.html',
  styleUrls: ['./emergency-page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardContent,
    MatIcon,
    MatIconButton,
    VideoCall,
    Navbar
  ]
})
export class EmergencyPage implements OnInit, AfterViewInit {
  @ViewChild(VideoCall) videoCallComponent!: VideoCall;

  private locationService = inject(LocationService);

  // Status-Signale für die UI
  address = signal<string>('Standort wird geladen…');
  etaSeconds = signal(195); // Beispiel: 3:15 Min
  durationSeconds = signal(0);

  ngOnInit() {
    this.fetchLatestLocation();
    this.startTimers();
  }

  ngAfterViewInit() {
    // Startet das Video-Element verzögert, um sicherzugehen, dass ViewChild bereit ist
    setTimeout(() => {
      if (this.videoCallComponent) {
        this.videoCallComponent.startCall();
      }
    }, 500);
  }

  /** Ruft den letzten Standort vom Backend ab */
  fetchLatestLocation() {
    this.locationService.getLocations().subscribe({
      next: (notrufe) => {
        if (notrufe && notrufe.length > 0) {
          const last = notrufe[notrufe.length - 1];
          this.updateAddress(last.latitude, last.longitude);
        } else {
          this.address.set('Kein Standort verfügbar');
        }
      },
      error: (err) => {
        console.error('API Fehler:', err);
        this.address.set('Verbindung zum Leitstellen-Backend fehlgeschlagen');
      }
    });
  }

  /** Wandelt die Koordinaten in Text um */
  private updateAddress(lat: number, lon: number) {
    this.locationService.getAddressFromCoords(lat, lon).subscribe({
      next: (res) => {
        const addr = res.address;
        if (!addr) {
          this.address.set(`Position: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          return;
        }

        const road = addr.road || 'Unbekannte Straße';
        const houseNumber = addr.house_number || '';
        const postcode = addr.postcode || '';
        const city = addr.city || addr.town || addr.village || '';

        const fullAddress = `${road} ${houseNumber}${postcode || city ? ', ' + postcode + ' ' + city : ''}`;
        this.address.set(fullAddress.trim());
      },
      error: () => {
        this.address.set('Standort bekannt, Adresse konnte nicht geladen werden');
      }
    });
  }

  /** Timer-Logik für Einsatzdauer und Ankunftszeit */
  startTimers() {
    setInterval(() => {
      this.durationSeconds.update(v => v + 1);
      this.etaSeconds.update(v => (v > 0 ? v - 1 : 0));
    }, 1000);
  }

  /** Hilfsfunktion zur Zeitformatierung in der HTML */
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}