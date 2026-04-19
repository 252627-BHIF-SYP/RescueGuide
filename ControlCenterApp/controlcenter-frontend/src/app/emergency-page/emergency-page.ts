import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
<<<<<<< HEAD
import { MatIconButton, MatButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';

interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}
=======
import { MatIconButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { LocationService, Notruf } from '../services/location.service';
>>>>>>> ea0481415d1eb60e1e74e20cb7add60feb09f835

@Component({
  selector: 'app-emergency-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatProgressBar,
    MatList,
    MatListItem,
    MatDivider,
    RouterLink,
    RouterLinkActive,
    MatIconButton,
    MatButton,
    VideoCall,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage implements OnInit, OnDestroy {
  // Signale
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  address = signal<string>('Adresse wird geladen…');
  status = signal('Standort wird geladen…');
  durationSeconds = signal(0);
  mapUrl = signal<SafeResourceUrl | null>(null);

<<<<<<< HEAD
  emergencyData = signal({
    type: '',
    callerName: '',
    callerType: '',
    callbackNumber: '',
    address: '',
    injuredCount: '',
    description: '',
    dispatcherName: '',
    date: '',
    time: '',
    alarmedRD: false,
    alarmedNA: false,
    alarmedPol: false,
    alarmedFW: false
  });

  private backendUrl = 'http://localhost:5062/api/leitstelle/all';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private auth: AuthService
  ) {}
=======
  // Injections
  private locationService = inject(LocationService);
  private sanitizer = inject(DomSanitizer);
>>>>>>> ea0481415d1eb60e1e74e20cb7add60feb09f835

  ngOnInit() {
    this.fetchLatestLocation();
    this.startTimers();
<<<<<<< HEAD
    this.initializeDefaultData();

    setInterval(() => this.fetchLatestLocation(), 5000);
  }

  initializeDefaultData() {
    const now = new Date();
    this.emergencyData.update(data => ({
      ...data,
      dispatcherName: this.auth.userName() || '',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5)
    }));
  }
=======
  }

  ngOnDestroy() {}
>>>>>>> ea0481415d1eb60e1e74e20cb7add60feb09f835

  startTimers() {
    setInterval(() => {
      this.durationSeconds.update(v => v + 1);
    }, 1000);
  }

  fetchLatestLocation() {
    this.locationService.getLocations().subscribe({
      next: (notrufe) => {
        if (!notrufe || notrufe.length === 0) {
          this.status.set('Kein Notruf vorhanden');
          this.latitude.set(null);
          this.longitude.set(null);
          this.address.set('Kein Standort verfügbar');
          this.mapUrl.set(null);
          return;
        }

        const last = notrufe[notrufe.length - 1];
        this.latitude.set(last.latitude);
        this.longitude.set(last.longitude);
        this.status.set('Aktueller Notruf');
        this.fetchAddress(last.latitude, last.longitude);
        // Setze mapUrl nur einmalig beim Standort-Fetch
        const url = `https://maps.google.com/maps?q=${last.latitude},${last.longitude}&z=15&output=embed`;
        this.mapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
      },
      error: (err) => {
        console.error('Fehler beim Laden der Notrufe', err);
        this.status.set('Backend nicht erreichbar');
        this.address.set('Backend nicht erreichbar');
        this.mapUrl.set(null);
      }
    });
  }

  /** Holt die Adresse zu den Koordinaten (Reverse Geocoding via Nominatim) */
  fetchAddress(lat: number, lon: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=de`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          this.address.set(data.display_name);
        } else {
          this.address.set('Adresse nicht gefunden');
        }
      })
      .catch(() => this.address.set('Adresse nicht gefunden'));
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}