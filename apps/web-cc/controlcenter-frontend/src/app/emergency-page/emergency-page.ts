import { Component, OnInit, signal, inject, OnDestroy, computed, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { EmergencyChecklist } from '../emergency-checklist/emergency-checklist';
import { LocationService, Notruf } from '../services/location.service';
import { EmergencyService } from '../services/emergency.service';

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
    MatButton,
    MatIconButton,
    VideoCall,
    EmergencyChecklist
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage implements OnInit, OnDestroy {
  @ViewChild(VideoCall) videoCallComponent!: VideoCall;
  @ViewChild('mapIframe') mapIframe?: ElementRef<HTMLIFrameElement>;

  private sanitizer = inject(DomSanitizer);
  public locationService = inject(LocationService);
  public emergencyService = inject(EmergencyService);

  lastLocation = signal<Notruf | null>(null);
  status = computed(() => this.lastLocation() ? 'Aktueller Notruf' : 'Kein Standort verfügbar');
  latitude = computed(() => this.lastLocation()?.latitude ?? null);
  longitude = computed(() => this.lastLocation()?.longitude ?? null);

  private router = inject(Router);

  durationSeconds = this.emergencyService.durationSeconds;
  emergencyData = this.emergencyService.protocol;

  private pollingInterval: any;
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private _mapUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    this.fetchLatestLocation();
    this.pollingInterval = setInterval(() => this.fetchLatestLocation(), 5000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  endCall() {
    if (this.videoCallComponent) {
      this.videoCallComponent.endCall();
    }
    
    // Protokoll final speichern und Notfall beenden
    this.emergencyService.endEmergency();
    this.router.navigate(['/dashboard']);
  }

  fetchLatestLocation() {
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        if (locations && locations.length > 0) {
          const loc = locations[locations.length - 1];
          this.lastLocation.set(loc);
          // Nur wenn sich die Koordinaten ändern, mapUrl neu setzen
          if (loc.latitude !== this.lastLat || loc.longitude !== this.lastLng) {
            this.lastLat = loc.latitude;
            this.lastLng = loc.longitude;
            this._mapUrl = this.createMapUrl(loc.latitude, loc.longitude);
          }
        } else {
          this.lastLocation.set(null);
          this._mapUrl = null;
          this.lastLat = null;
          this.lastLng = null;
        }
      },
      error: () => {
        this.lastLocation.set(null);
        this._mapUrl = null;
        this.lastLat = null;
        this.lastLng = null;
      }
    });
  }

  get mapUrl(): SafeResourceUrl | null {
    return this._mapUrl;
  }

  private createMapUrl(lat: number, lng: number): SafeResourceUrl {
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  toggleMapFullscreen() {
    if (this.mapIframe && this.mapIframe.nativeElement) {
      const elem = this.mapIframe.nativeElement;
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch((err: any) => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }
}
