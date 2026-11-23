import { Component, input, output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { EmergencyProtocol, EmergencyService } from '../services/emergency.service';
import { PdfExportService, PdfExportMetadata } from '../services/pdf-export.service';
import {
  InstructionHistoryEntry,
  parseInstructionHistory,
} from '../services/instruction-flow.service';

@Component({
  selector: 'app-emergency-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIcon, MatCard, MatCardContent],
  templateUrl: './emergency-checklist.html',
  styleUrl: './emergency-checklist.scss',
})
export class EmergencyChecklist {
  emergencyData = input.required<EmergencyProtocol>();
  showExportButton = input<boolean>(true);
  showMeasuresCta = input<boolean>(false);
  meta = input<PdfExportMetadata | null>(null);

  protocolChange = output<EmergencyProtocol>();
  openMeasures = output<void>();

  private emergencyService = inject(EmergencyService);
  public pdfExportService = inject(PdfExportService);
  private cdr = inject(ChangeDetectorRef);

  readonly totalFields = 7;

  readonly emergencyTypes: ReadonlyArray<{ value: string; label: string; icon: string }> = [
    { value: 'Medizinischer Notfall', label: 'Medizinischer Notfall', icon: 'medical_services' },
    { value: 'Verkehrsunfall', label: 'Verkehrsunfall', icon: 'car_crash' },
    { value: 'Brand', label: 'Brand', icon: 'local_fire_department' },
    { value: 'Polizeilicher Notfall', label: 'Polizeilicher Notfall', icon: 'local_police' },
    { value: 'Technische Hilfeleistung', label: 'Technische Hilfeleistung', icon: 'build' },
    { value: 'Sonstiges', label: 'Sonstiges', icon: 'emergency' },
  ];

  readonly injuredPresets: ReadonlyArray<number> = [0, 1, 2, 3, 4];

  readonly wizardSteps: ReadonlyArray<{ num: number; label: string }> = [
    { num: 1, label: 'Notfallart' },
    { num: 2, label: 'Verletzte' },
    { num: 3, label: 'Kurz-Lage' },
    { num: 4, label: 'Alarmierung & Ort' },
    { num: 5, label: 'Anrufer & Details' },
  ];

  isFilled(field: string): boolean {
    const d = this.emergencyData();
    if (!d) return false;
    switch (field) {
      case 'type':
        return !!d.type && !!d.type.trim();
      case 'address':
        return !!d.address && !!d.address.trim();
      case 'injuredCount':
        return d.injuredCount !== '' && d.injuredCount !== null && d.injuredCount !== undefined;
      case 'description':
        return !!d.description && !!d.description.trim();
      case 'callerName':
        return !!d.callerName && !!d.callerName.trim();
      case 'callbackNumber':
        return !!d.callbackNumber && !!d.callbackNumber.trim();
      case 'callerType':
        return !!d.callerType && !!d.callerType.trim();
      case 'dispatcherName':
        return !!d.dispatcherName && !!d.dispatcherName.trim();
      case 'alarms':
        return !!(d.alarmedRD || d.alarmedNA || d.alarmedPol || d.alarmedFW);
      default:
        return false;
    }
  }

  get filledFieldsCount(): number {
    let count = 0;
    if (this.isFilled('type')) count++;
    if (this.isFilled('address')) count++;
    if (this.isFilled('callerName')) count++;
    if (this.isFilled('callbackNumber')) count++;
    if (this.isFilled('injuredCount')) count++;
    if (this.isFilled('description')) count++;
    if (this.isFilled('alarms')) count++;
    return count;
  }

  get progressPercent(): number {
    return Math.round((this.filledFieldsCount / this.totalFields) * 100);
  }

  get alarmedUnitsCount(): number {
    const d = this.emergencyData();
    let c = 0;
    if (d.alarmedRD) c++;
    if (d.alarmedNA) c++;
    if (d.alarmedPol) c++;
    if (d.alarmedFW) c++;
    return c;
  }

  selectEmergencyType(type: string): void {
    this.emergencyData().type = type;
    this.onFieldChange();
  }

  selectInjuredCount(count: number): void {
    this.emergencyData().injuredCount = count;
    this.onFieldChange();
  }

  isInjuredPresetActive(count: number): boolean {
    return this.isFilled('injuredCount') && Number(this.emergencyData().injuredCount) === count;
  }

  isStepDone(step: number): boolean {
    switch (step) {
      case 1:
        return this.isFilled('type');
      case 2:
        return this.isFilled('injuredCount');
      case 3:
        return this.isFilled('description');
      case 4:
        return this.isFilled('alarms') && this.isFilled('address');
      case 5:
        return this.isFilled('callerName') && this.isFilled('callbackNumber');
      default:
        return false;
    }
  }

  get activeWizardStep(): number {
    for (let step = 1; step <= 5; step++) {
      if (!this.isStepDone(step)) {
        return step;
      }
    }
    return 0;
  }

  get coreTriageDoneCount(): number {
    let count = 0;
    if (this.isStepDone(1)) count++;
    if (this.isStepDone(2)) count++;
    if (this.isStepDone(3)) count++;
    return count;
  }

  get isCoreTriageComplete(): boolean {
    return this.isStepDone(1) && this.isStepDone(2) && this.isStepDone(3);
  }

  scrollToStep(stepNumber: number): void {
    if (typeof document === 'undefined') return;
    const stepEl = document.getElementById(`wizard-step-${stepNumber}`);
    if (!stepEl) return;
    stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const focusable = stepEl.querySelector<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)',
    );
    focusable?.focus({ preventScroll: true });
  }

  onFieldChange() {
    this.cdr.markForCheck();
    this.emergencyService.updateProtocol(this.emergencyData());
    this.protocolChange.emit(this.emergencyData());
  }

  toggleAlarm(unit: 'RD' | 'NA' | 'Pol' | 'FW') {
    const d = this.emergencyData();
    switch (unit) {
      case 'RD':
        d.alarmedRD = !d.alarmedRD;
        break;
      case 'NA':
        d.alarmedNA = !d.alarmedNA;
        break;
      case 'Pol':
        d.alarmedPol = !d.alarmedPol;
        break;
      case 'FW':
        d.alarmedFW = !d.alarmedFW;
        break;
    }
    this.onFieldChange();
  }

  get instructionHistory(): InstructionHistoryEntry[] {
    return parseInstructionHistory(this.emergencyData()?.instructionHistory);
  }

  get completedHistoryCount(): number {
    return this.instructionHistory.filter((e) => e.status === 'erledigt').length;
  }

  formatHistoryTime(iso?: string | null): string {
    if (!iso) return '–';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '–';
    return `${d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} Uhr`;
  }

  exportPdf() {
    const metaData: PdfExportMetadata = {
      emergencyId: this.meta()?.emergencyId ?? this.emergencyService.activeEmergencyId(),
      startedAt: this.meta()?.startedAt,
      endedAt: this.meta()?.endedAt,
      status: this.meta()?.status ?? 'In Bearbeitung',
    };
    this.pdfExportService.exportProtocol(this.emergencyData(), metaData);
  }
}
