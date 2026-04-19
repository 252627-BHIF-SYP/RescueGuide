import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconButton, MatButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';

interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

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
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private auth = inject(AuthService);

  latitude = signal<number | null>(null);
  longitude = signal<number | null>(null);
  status = signal('Standort wird geladen…');
  durationSeconds = signal(0);
  
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
  private timerInterval: any;
  private pollingInterval: any;

  ngOnInit() {
    this.fetchLatestLocation();
    this.startTimers();
    this.initializeDefaultData();

    this.pollingInterval = setInterval(() => this.fetchLatestLocation(), 5000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.pollingInterval) clearInterval(this.pollingInterval);
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

  startTimers() {
    this.timerInterval = setInterval(() => {
      this.durationSeconds.update(v => v + 1);
    }, 1000);
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

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
