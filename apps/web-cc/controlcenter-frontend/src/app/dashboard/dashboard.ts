import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardEmergency, DashboardService } from '../services/dashboard.service';
import { EmergencyProtocol, EmergencyService } from '../services/emergency.service';
import { PdfExportService, PdfExportMetadata } from '../services/pdf-export.service';
import { EmergencyChecklist } from '../emergency-checklist/emergency-checklist';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    EmergencyChecklist,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly emergencyService = inject(EmergencyService);
  private readonly pdfExportService = inject(PdfExportService);

  private refreshInterval?: ReturnType<typeof setInterval>;

  readonly emergencies = signal<DashboardEmergency[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal('');

  // Protokoll-Bearbeitung & Dialog (Issue 133 & 97)
  readonly selectedEmergency = signal<DashboardEmergency | null>(null);
  readonly selectedProtocol = signal<EmergencyProtocol | null>(null);
  readonly loadingProtocol = signal<boolean>(false);
  readonly protocolError = signal<string>('');
  readonly isSavingProtocol = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);
  readonly hasUnsavedChanges = signal<boolean>(false);
  private initialProtocolSnapshot = '';

  readonly activeEmergencies = computed(() =>
    this.emergencies().filter((emergency) => emergency.status === 'Active'),
  );
  readonly completedEmergencies = computed(() =>
    this.emergencies().filter((emergency) => emergency.status === 'Completed'),
  );

  getLocationLabel(emergency: DashboardEmergency): string {
    if (emergency.address?.trim()) {
      return emergency.address;
    }

    return 'Adresse nicht erfasst';
  }

  ngOnInit(): void {
    this.loadEmergencies();
    this.refreshInterval = setInterval(() => this.loadEmergencies(true), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadEmergencies(silent = false): void {
    silent ? this.refreshing.set(true) : this.loading.set(true);

    this.dashboardService.getEmergencies().subscribe({
      next: (emergencies) => {
        this.emergencies.set(emergencies);
        this.error.set('');
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: () => {
        this.error.set('Notrufe konnten nicht geladen werden.');
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  // ── Protokoll im Nachhinein aufrufen und bearbeiten (Issue 133) ──
  openProtocolDialog(emergency: DashboardEmergency): void {
    this.selectedEmergency.set(emergency);
    this.selectedProtocol.set(null);
    this.loadingProtocol.set(true);
    this.protocolError.set('');
    this.saveSuccess.set(false);

    this.emergencyService.getProtocolByEmergencyId(emergency.id).subscribe({
      next: (protocol) => {
        this.selectedProtocol.set(protocol);
        this.initialProtocolSnapshot = JSON.stringify(protocol);
        this.hasUnsavedChanges.set(false);
        this.loadingProtocol.set(false);
      },
      error: (err) => {
        console.error('Fehler beim Laden des Einsatzprotokolls', err);
        this.protocolError.set('Das Einsatzprotokoll konnte nicht geladen werden.');
        this.loadingProtocol.set(false);
      },
    });
  }

  closeProtocolDialog(): void {
    this.selectedEmergency.set(null);
    this.selectedProtocol.set(null);
    this.protocolError.set('');
    this.saveSuccess.set(false);
    this.hasUnsavedChanges.set(false);
    this.initialProtocolSnapshot = '';
  }

  onProtocolChanged(updated: EmergencyProtocol): void {
    this.selectedProtocol.set(updated);
    this.hasUnsavedChanges.set(JSON.stringify(updated) !== this.initialProtocolSnapshot);
  }

  saveSelectedProtocol(): void {
    const proto = this.selectedProtocol();
    if (!proto) return;

    const protocolId = proto.id;
    if (!protocolId) {
      this.protocolError.set('Keine Protokoll-ID vorhanden.');
      return;
    }

    this.isSavingProtocol.set(true);
    this.emergencyService.saveProtocolById(protocolId, proto).subscribe({
      next: () => {
        this.isSavingProtocol.set(false);
        this.initialProtocolSnapshot = JSON.stringify(this.selectedProtocol());
        this.hasUnsavedChanges.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 3000);
        // Dashboard im Hintergrund aktualisieren, falls Art oder Adresse angepasst wurden
        this.loadEmergencies(true);
      },
      error: (err) => {
        console.error('Fehler beim Speichern des Protokolls', err);
        this.isSavingProtocol.set(false);
        this.protocolError.set('Fehler beim Speichern der Änderungen.');
      },
    });
  }

  // ── PDF-Export des Einsatzprotokolls (Issue 97) ──
  exportEmergencyPdf(emergency: DashboardEmergency, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedEmergency()?.id === emergency.id && this.selectedProtocol()) {
      this.pdfExportService.exportProtocol(
        this.selectedProtocol()!,
        this.getEmergencyMeta(emergency),
      );
      return;
    }

    this.emergencyService.getProtocolByEmergencyId(emergency.id).subscribe({
      next: (proto) => {
        this.pdfExportService.exportProtocol(proto, this.getEmergencyMeta(emergency));
      },
      error: (err) => {
        console.error('Fehler beim Abrufen des Protokolls für PDF-Export', err);
      },
    });
  }

  getEmergencyMeta(emergency: DashboardEmergency): PdfExportMetadata {
    return {
      emergencyId: emergency.id,
      startedAt: emergency.startedAt,
      endedAt: emergency.endedAt,
      status: emergency.status === 'Active' ? 'Aktiv' : 'Beendet',
    };
  }

  get currentSelectedMeta(): PdfExportMetadata | null {
    const em = this.selectedEmergency();
    return em ? this.getEmergencyMeta(em) : null;
  }
}
