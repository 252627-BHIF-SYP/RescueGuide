import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmergencyProtocol, EmergencyService } from '../services/emergency.service';

@Component({
  selector: 'app-emergency-checklist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIcon,
    MatCard,
    MatCardHeader,
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
  private emergencyService = inject(EmergencyService);

  readonly totalFields = 8;

  get filledFieldsCount(): number {
    const d = this.emergencyData();
    let count = 0;
    if (d.type && d.type.trim()) count++;
    if (d.address && d.address.trim()) count++;
    if (d.date && d.time) count++;
    if (d.callerName && d.callerName.trim()) count++;
    if (d.callbackNumber && d.callbackNumber.trim()) count++;
    if (d.injuredCount !== '' && d.injuredCount !== null && d.injuredCount !== undefined) count++;
    if (d.description && d.description.trim()) count++;
    if (d.alarmedRD || d.alarmedNA || d.alarmedPol || d.alarmedFW) count++;
    return count;
  }

  get progressPercent(): number {
    return Math.round((this.filledFieldsCount / this.totalFields) * 100);
  }

  onFieldChange() {
    this.emergencyService.updateProtocol(this.emergencyData());
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
}
