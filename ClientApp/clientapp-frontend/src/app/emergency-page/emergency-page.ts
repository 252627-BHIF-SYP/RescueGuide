import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import {VideoCall} from '../video-call/video-call';

interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

interface NominatimResponse {
  address: {
    house_number?: string;
    road?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

@Component({
  selector: 'app-emergency-page',
  templateUrl: './emergency-page.html',
  styleUrls: ['./emergency-page.scss'],
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatIcon,
    MatIconButton,
    MatCardTitle,
    VideoCall
  ],
  standalone: true
})
export class EmergencyPage implements OnInit {
  public videoCall = inject(VideoCall);
  address = signal<string>('Standort wird geladen…');
  etaSeconds = signal(3 * 60 + 15);
  durationSeconds = signal(0);

  private backendUrl = 'http://localhost:5062/api/leitstelle/all';
  private http = inject(HttpClient);

  ngOnInit() {
    this.fetchLatestLocation();
    this.startTimers();
  }

  fetchLatestLocation() {
    this.http.get<Notruf[]>(this.backendUrl).subscribe({
      next: (notrufe) => {
        if (!notrufe || notrufe.length === 0) {
          this.address.set('Kein Standort verfügbar');
          return;
        }

        const last = notrufe[notrufe.length - 1];

        this.fetchAddress(last.latitude, last.longitude);
      },
      error: () => {
        this.address.set('Backend nicht erreichbar');
      }
    });
  }

  fetchAddress(lat: number, lon: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

    this.http.get<NominatimResponse>(url).subscribe({
      next: (res) => {
        if (!res.address) {
          this.address.set('Adresse nicht gefunden');
          return;
        }

        const road = res.address.road || '';
        const houseNumber = res.address.house_number || '';
        const postcode = res.address.postcode || '';
        const city = res.address.city || res.address.town || res.address.village || '';

        let fullAddress = '';
        if (road && houseNumber) {
          fullAddress = `${road} ${houseNumber}`;
        } else if (road) {
          fullAddress = road;
        } else {
          fullAddress = 'Straße unbekannt';
        }

        if (postcode || city) {
          fullAddress += `, ${postcode} ${city}`;
        }

        this.address.set(fullAddress);
      },
      error: () => {
        this.address.set('Adresse nicht abrufbar');
      }
    });
  }

  startTimers() {
    setInterval(() => {
      this.durationSeconds.update(v => v + 1);
      this.etaSeconds.update(v => (v > 0 ? v - 1 : 0));
    }, 1000);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
