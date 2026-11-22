import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDeleteData {
  type: 'plan' | 'measure' | 'protocol';
  name: string;
  /** Nur bei type 'protocol': Einsatz ist noch nicht beendet */
  isActive?: boolean;
  affectedPlansCount?: number;
  planNames?: string[];
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './confirm-delete-dialog.html',
  styleUrl: './confirm-delete-dialog.scss'
})
export class ConfirmDeleteDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDeleteData) {}

  get title(): string {
    switch (this.data.type) {
      case 'plan':
        return 'Einsatzplan löschen?';
      case 'protocol':
        return 'Einsatzprotokoll löschen?';
      default:
        return 'Sofortmaßnahme löschen?';
    }
  }

  get targetLabel(): string {
    switch (this.data.type) {
      case 'plan':
        return 'den Einsatzplan';
      case 'protocol':
        return 'das Einsatzprotokoll';
      default:
        return 'die Sofortmaßnahme';
    }
  }
}

