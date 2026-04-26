import { Component, Inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { InstructionMenuService, Measure } from '../../../services/instruction-menu.service';
import { CreateMeasureDialog } from '../create-measure-dialog/create-measure-dialog';
import { Subscription } from 'rxjs';

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
    // Reagiere auf Änderungen der verfügbaren Maßnahmen auch während der Dialog offen ist, um die Liste aktuell zu halten
    this.subscription = this.service.availableMeasures$.subscribe(measures => {
      this.availableMeasures = measures;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    // Rollback aller temporären Maßnahmen, falls der Dialog geschlossen wird ohne zu speichern
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
        const newMeasure = this.service.createMeasure(result.name, result.description);
        this.tempMeasureIds.push(newMeasure.id);
        
        // Die neue Maßnahme automatisch zur Auswahl hinzufügen
        const currentSelected = this.planForm.get('selectedMeasures')?.value || [];
        this.planForm.get('selectedMeasures')?.setValue([...currentSelected, newMeasure]);
        this.cdr.markForCheck();
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
