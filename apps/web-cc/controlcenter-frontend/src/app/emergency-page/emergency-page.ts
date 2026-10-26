import {
  Component,
  OnInit,
  signal,
  inject,
  OnDestroy,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { VideoCall } from '../video-call/video-call';
import { EmergencyChecklist } from '../emergency-checklist/emergency-checklist';
import { PlanSelector } from '../plan-selector/plan-selector';
import { LocationService, Notruf } from '../services/location.service';
import { EmergencyService } from '../services/emergency.service';
import { PdfExportService } from '../services/pdf-export.service';

@Component({
  selector: 'app-emergency-page',
  standalone: true,
  imports: [CommonModule, MatIcon, MatButton, VideoCall, EmergencyChecklist, PlanSelector],
  templateUrl: './emergency-page.html',
  styleUrl: './emergency-page.scss',
})
export class EmergencyPage implements OnInit, OnDestroy {
  @ViewChild(VideoCall) videoCallComponent!: VideoCall;
  @ViewChild('mapIframe') mapIframe?: ElementRef<HTMLIFrameElement>;

  // Tab State für den Arbeitsbereich
  activeTab: 'checklist' | 'plans' = 'checklist';

  // Karten & Standort-Zustände
  showMap = signal<boolean>(false);
  geocodedAddress = signal<string | null>(null);
  copiedCoords = signal<boolean>(false);
  showEndConfirm = signal<boolean>(false);

  // Nachbearbeitungs-Zustand (Issue 133)
  isPostEmergencyReview = signal<boolean>(false);
  endedEmergencyId = signal<number | null>(null);
  emergencyEndedAt = signal<Date | null>(null);
  isSaving = signal<boolean>(false);
  saveSuccess = signal<boolean>(false);

  private http = inject(HttpClient);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  public locationService = inject(LocationService);
  public emergencyService = inject(EmergencyService);
  public pdfExportService = inject(PdfExportService);

  lastLocation = signal<Notruf | null>(null);
  status = computed(() => (this.lastLocation() ? 'Aktueller Notruf' : 'Kein Standort verfügbar'));
  latitude = computed(() => this.lastLocation()?.latitude ?? null);
  longitude = computed(() => this.lastLocation()?.longitude ?? null);

  durationSeconds = this.emergencyService.durationSeconds;
  emergencyData = this.emergencyService.protocol;

  reviewMeta = computed(() => ({
    emergencyId: this.endedEmergencyId() || this.emergencyService.activeEmergencyId(),
    endedAt: this.emergencyEndedAt(),
    status: 'Abgeschlossen',
  }));

  private pollingInterval: any;
  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private _mapUrl: SafeResourceUrl | null = null;

  // Formatierte Koordinaten für die Anzeige
  formattedCoordinates = computed(() => {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lng === null) return '';
    return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
  });

  // Angezeigte Adresse (Priorität: Protokoll-Adresse > Geocodierte Adresse > Koordinaten > Placeholder)
  displayAddress = computed(() => {
    const protoAddr = this.emergencyData().address;
    if (protoAddr && protoAddr.trim().length > 0) {
      return protoAddr;
    }
    if (this.geocodedAddress()) {
      return this.geocodedAddress()!;
    }
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat !== null && lng !== null) {
      return `GPS: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
    }
    return 'Warte auf GPS-Standort…';
  });

  ngOnInit() {
    this.emergencyService.resetTimer();
    this.emergencyService.startTimer();
    this.fetchLatestLocation();
    this.pollingInterval = setInterval(() => this.fetchLatestLocation(), 5000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    this.emergencyService.stopTimer();
  }

  toggleMap() {
    this.showMap.update((v) => !v);
  }

  copyCoordinates() {
    const lat = this.latitude();
    const lng = this.longitude();
    if (lat === null || lng === null) return;

    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copiedCoords.set(true);
        setTimeout(() => this.copiedCoords.set(false), 2500);
      })
      .catch(() => {
        // Fallback falls Clipboard API blockiert ist
        this.copiedCoords.set(true);
        setTimeout(() => this.copiedCoords.set(false), 2500);
      });
  }

  requestEndCall() {
    this.showEndConfirm.set(true);
  }

  cancelEndCall() {
    this.showEndConfirm.set(false);
  }

  confirmEndCall() {
    this.showEndConfirm.set(false);
    this.endCall();
  }

  endCall() {
    const activeId = this.emergencyService.activeEmergencyId();
    this.endedEmergencyId.set(activeId);
    this.emergencyEndedAt.set(new Date());

    if (this.videoCallComponent) {
      this.videoCallComponent.endCall(false);
    }

    // Protokoll im Backend schließen, aber Session für Nachbearbeitung behalten! (Issue 133)
    this.emergencyService.endEmergency(true);
    this.isPostEmergencyReview.set(true);
  }

  savePostReviewProtocol() {
    this.isSaving.set(true);
    this.emergencyService.executeSaveProtocol();
    setTimeout(() => {
      this.isSaving.set(false);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    }, 400);
  }

  exportPdf() {
    const meta = {
      emergencyId: this.endedEmergencyId() || this.emergencyService.activeEmergencyId(),
      startedAt: null,
      endedAt: this.emergencyEndedAt(),
      status: 'Abgeschlossen',
    };
    this.pdfExportService.exportProtocol(this.emergencyData(), meta);
  }

  finishReviewAndExit() {
    this.emergencyService.executeSaveProtocol();
    this.emergencyService.clearActiveEmergency();
    this.router.navigate(['/dashboard']);
  }

  fetchLatestLocation() {
    const activeCallerId = this.emergencyService.activeCallerId();
    const activeLocation = this.emergencyService.currentLocation();
    if (activeCallerId) {
      if (activeLocation) this.applyLocation(activeLocation);
      return;
    }

    this.locationService.getLocations().subscribe({
      next: (locations) => {
        if (locations && locations.length > 0) {
          this.applyLocation(locations[locations.length - 1]);
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
      },
    });
  }

  private applyLocation(location: Notruf) {
    this.lastLocation.set(location);
    if (location.latitude !== this.lastLat || location.longitude !== this.lastLng) {
      this.lastLat = location.latitude;
      this.lastLng = location.longitude;
      this._mapUrl = this.createMapUrl(location.latitude, location.longitude);
      this.reverseGeocode(location.latitude, location.longitude);
    }
  }

  private reverseGeocode(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    this.http.get<any>(url, { headers: { 'Accept-Language': 'de' } }).subscribe({
      next: (res) => {
        if (res && res.address) {
          const addr = res.address;
          const road = addr.road || addr.pedestrian || addr.street || addr.suburb || '';
          const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
          const postcode = addr.postcode ? `${addr.postcode} ` : '';
          const city = addr.city || addr.town || addr.village || addr.municipality || '';

          let formatted = '';
          if (road && city) {
            formatted = `${road}${houseNumber}, ${postcode}${city}`.trim();
          } else if (res.display_name) {
            formatted = res.display_name.split(',').slice(0, 3).join(',').trim();
          }

          if (formatted) {
            this.geocodedAddress.set(formatted);
            // Wenn das Notfallprotokoll noch keine Adresse hat, automatisch befüllen
            if (!this.emergencyService.protocol().address) {
              this.emergencyService.updateProtocol({ address: formatted });
            }
          }
        }
      },
      error: () => {
        // Stiller Fallback bei Netzwerk- oder Rate-Limit-Fehlern
      },
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
