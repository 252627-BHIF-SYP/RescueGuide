import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDeleteData {
  type: 'plan' | 'measure';
  name: string;
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
}

