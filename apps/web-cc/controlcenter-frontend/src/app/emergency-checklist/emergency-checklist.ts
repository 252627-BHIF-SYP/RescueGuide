import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmergencyProtocol, EmergencyService } from '../services/emergency.service';
import { PdfExportService, PdfExportMetadata } from '../services/pdf-export.service';

@Component({
  selector: 'app-emergency-checklist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatCard,
    MatCardContent,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './emergency-checklist.html',
  styleUrl: './emergency-checklist.scss',
})
export class EmergencyChecklist {
  emergencyData = input.required<EmergencyProtocol>();
  showExportButton = input<boolean>(true);
  meta = input<PdfExportMetadata | null>(null);

  protocolChange = output<EmergencyProtocol>();

  private emergencyService = inject(EmergencyService);
  public pdfExportService = inject(PdfExportService);

  readonly totalFields = 7;

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

  onFieldChange() {
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
