import { Component, OnInit, signal, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDivider, MatList, MatListItem } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconButton, MatButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { EmergencyChecklist } from '../emergency-checklist/emergency-checklist';
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
    MatProgressBar,
    MatList,
    MatListItem,
    MatDivider,
    RouterLink,
    RouterLinkActive,
    MatIconButton,
    MatButton,
    VideoCall,
    EmergencyChecklist
  ],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage implements OnInit, OnDestroy {
  private sanitizer = inject(DomSanitizer);
  public emergencyService = inject(EmergencyService);

  latitude = computed(() => this.emergencyService.currentLocation()?.latitude ?? null);
  longitude = computed(() => this.emergencyService.currentLocation()?.longitude ?? null);
  
  status = computed(() => {
    const loc = this.emergencyService.currentLocation();
    return loc ? 'Aktueller Notruf' : 'Kein Notruf vorhanden';
  });

  durationSeconds = this.emergencyService.durationSeconds;
  emergencyData = this.emergencyService.protocol;

  private pollingInterval: any;

  ngOnInit() {
    this.emergencyService.fetchLocation();
    this.pollingInterval = setInterval(() => this.emergencyService.fetchLocation(), 5000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  get mapUrl(): SafeResourceUrl | null {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lng === null) return null;
    const url = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
