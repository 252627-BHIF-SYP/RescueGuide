import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EmergencyProtocol } from '../services/emergency.service';

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
    MatCardTitle,
    MatCardContent,
    MatCheckboxModule,
    MatDivider,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './emergency-checklist.html',
  styleUrl: './emergency-checklist.scss'
})
export class EmergencyChecklist {
  emergencyData = input.required<EmergencyProtocol>();
}
