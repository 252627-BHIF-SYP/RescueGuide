import { Component, Inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon'; // Import ist da!
import { InstructionMenuService, Measure } from '../../../services/instruction-menu.service';
import { CreateMeasureDialog } from '../create-measure-dialog/create-measure-dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'create-plan-dialog',
  templateUrl: './create-plan-dialog.html',
  styleUrl: './create-plan-dialog.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule // Im Array vorhanden!
  ]
})
export class CreatePlanDialog implements OnInit, OnDestroy {
  planForm: FormGroup;
  availableMeasures: Measure[] = [];
  private tempMeasureIds: number[] = [];
  private isSubmitted = false;
  private subscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CreatePlanDialog>,
    private cdr: ChangeDetectorRef,
    public service: InstructionMenuService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.planForm = this.fb.group({
      name: [data?.plan?.name || '', Validators.required],
      selectedMeasures: [data?.plan?.measures || []]
    });
  }

  ngOnInit() {
    this.subscription = this.service.availableMeasures$.subscribe(measures => {
      this.availableMeasures = measures;
      // detectChanges() stellt im Dialog-Kontext sicher, dass Kind-Elemente (wie mat-icon)
      // sofort fehlerfrei gerendert werden, wenn asynchrone Daten eintreffen.
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    if (!this.isSubmitted) {
      this.tempMeasureIds.forEach(id => this.service.rollbackMeasure(id));
    }
  }

  createNewMeasure() {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createMeasure(result.name, result.description, result.imageUrl).subscribe({
          next: (newMeasure) => {
            this.tempMeasureIds.push(newMeasure.id);
            const currentSelected = this.planForm.get('selectedMeasures')?.value || [];
            this.planForm.get('selectedMeasures')?.setValue([...currentSelected, newMeasure]);
            this.cdr.detectChanges(); // Auch hier Rendering erzwingen
          },
          error: (err) => console.error('Failed to create new measure from plan dialog', err)
        });
      }
    });
  }

  submit() {
    this.isSubmitted = true;
    this.dialogRef.close({
      name: this.planForm.get('name')?.value,
      selectedMeasures: this.planForm.get('selectedMeasures')?.value
    });
  }

  compareMeasures(o1: Measure, o2: Measure): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
