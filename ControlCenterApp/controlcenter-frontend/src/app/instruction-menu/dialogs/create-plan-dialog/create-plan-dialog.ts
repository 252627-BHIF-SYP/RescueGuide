import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { InstructionMenuService } from '../../../services/instruction-menu.service';
import { CreateMeasureDialog } from '../create-measure-dialog/create-measure-dialog';

@Component({
  selector: 'create-plan-dialog',
  templateUrl: './create-plan-dialog.html',
  styleUrl: './create-plan-dialog.scss',
  imports: [
    MatDialogModule,
    ReactiveFormsModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    CommonModule
  ]
})
export class CreatePlanDialog {
  planForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private service: InstructionMenuService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.planForm = this.fb.group({
      name: [data?.plan?.name || '', Validators.required],
      selectedMeasures: [data?.plan?.measures || []]
    });
  }

  createNewMeasure() {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newMeasure = this.service.createMeasure(result.name, result.description);
        // Add to selected
        const current = this.planForm.get('selectedMeasures')?.value || [];
        this.planForm.get('selectedMeasures')?.setValue([...current, newMeasure]);
        this.cdr.markForCheck();
      }
    });
  }

  getPlanData() {
    return {
      name: this.planForm.get('name')?.value,
      selectedMeasures: this.planForm.get('selectedMeasures')?.value
    };
  }
}
