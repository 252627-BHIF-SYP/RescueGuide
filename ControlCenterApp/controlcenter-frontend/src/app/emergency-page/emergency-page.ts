import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {MatIconButton} from '@angular/material/button';
import {VideoCall} from '../video-call/video-call';

interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-emergency-page',
  standalone: true,
  imports: [
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
export class EmergencyPage implements OnInit {

  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  status = signal('Standort wird geladen…');

  private backendUrl = 'http://localhost:5062/api/leitstelle/all';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.fetchLatestLocation();

    setInterval(() => this.fetchLatestLocation(), 5000);
  }

  fetchLatestLocation() {
    this.http.get<Notruf[]>(this.backendUrl).subscribe({
      next: (notrufe) => {
        if (!notrufe || notrufe.length === 0) {
          this.status.set('Kein Notruf vorhanden');
          this.latitude.set(null);
          this.longitude.set(null);
          return;
        }

        const last = notrufe[notrufe.length - 1];

        this.latitude.set(last.latitude);
        this.longitude.set(last.longitude);
        this.status.set('Aktueller Notruf');
      },
      error: (err) => {
        console.error('Fehler beim Laden der Notrufe', err);
        this.status.set('Backend nicht erreichbar');
      }
    });
  }

  get mapUrl(): SafeResourceUrl | null {
    if (this.latitude() === null || this.longitude() === null) return null;

    const url = `https://maps.google.com/maps?q=${this.latitude()},${this.longitude()}&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
