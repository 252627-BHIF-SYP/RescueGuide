import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { LocationService, Notruf } from '../services/location.service';

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
    VideoCall
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage implements OnInit, OnDestroy {
  // Signale
  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  status = signal('Standort wird geladen…');
  durationSeconds = signal(0);

  safeMapUrl = signal<SafeResourceUrl | null>(null);

  // Injections
  private locationService = inject(LocationService);
  private sanitizer = inject(DomSanitizer);

  private pollInterval?: any;
  private timerInterval?: any;

  ngOnInit() {
    this.fetchLatestLocation();
    this.startTimers();
    this.pollInterval = setInterval(() => this.fetchLatestLocation(), 5000);
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  startTimers() {
    this.timerInterval = setInterval(() => {
      this.durationSeconds.update(v => v + 1);
    }, 1000);
  }

  fetchLatestLocation() {
    this.locationService.getLatestLocations().subscribe({
      next: (notrufe: any[]) => {
        if (!notrufe || notrufe.length === 0) {
          this.status.set('Kein Notruf vorhanden');
          this.latitude.set(null);
          this.longitude.set(null);
          this.safeMapUrl.set(null);
          return;
        }

        const last = notrufe[notrufe.length - 1];
        
        // Prüfen, ob sich die Koordinaten überhaupt geändert haben, um unnötige Map-Reloads zu vermeiden
        if (last.latitude !== this.latitude() || last.longitude !== this.longitude()) {
            this.latitude.set(last.latitude);
            this.longitude.set(last.longitude);
            
            // Hier die URL einmalig berechnen und setzen
            const url = `https://maps.google.com/maps?q=${last.latitude},${last.longitude}&z=15&output=embed`;
            this.safeMapUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        }
        
        this.status.set('Aktueller Notruf');
      },
      error: (err) => {
        console.error('Fehler beim Laden der Notrufe', err);
        this.status.set('Backend nicht erreichbar');
      }
    });
  }

  /** Generiert die Google Maps URL für das iFrame */
  get mapUrl(): SafeResourceUrl | null {
    const lat = this.latitude();
    const lon = this.longitude();
    if (lat === null || lon === null) return null;

    // Fix: Die URL-Struktur für Google Maps Embed
    const url = `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}