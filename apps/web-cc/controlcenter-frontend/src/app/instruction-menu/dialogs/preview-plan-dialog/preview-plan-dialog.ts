import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'preview-plan-dialog',
  templateUrl: './preview-plan-dialog.html',
  styleUrl: './preview-plan-dialog.scss',
  imports: [
    MatDialogModule,
    MatButton,
    MatListModule,
    MatDivider,
    CommonModule
  ]
})
export class PreviewPlanDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
