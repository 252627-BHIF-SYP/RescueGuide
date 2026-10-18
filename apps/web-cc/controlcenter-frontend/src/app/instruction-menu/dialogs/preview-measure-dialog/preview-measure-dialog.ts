import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Measure } from '../../../services/instruction-menu.service';

export interface PreviewMeasureDialogData {
  measure: Measure;
  isSelected?: boolean;
  toggleSelection?: () => void;
}

@Component({
  selector: 'preview-measure-dialog',
  templateUrl: './preview-measure-dialog.html',
  styleUrl: './preview-measure-dialog.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class PreviewMeasureDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: PreviewMeasureDialogData) {}

  onToggle(): void {
    if (this.data.toggleSelection) {
      this.data.toggleSelection();
      this.data.isSelected = !this.data.isSelected;
    }
  }
}
