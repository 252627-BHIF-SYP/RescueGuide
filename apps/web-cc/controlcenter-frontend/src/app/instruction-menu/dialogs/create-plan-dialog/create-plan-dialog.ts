import { Component, Inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon'; // Import ist da!
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
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
    MatIconModule,
    CdkDropList,
    CdkDrag
  ]
})
export class CreatePlanDialog implements OnInit, OnDestroy {
  planForm: FormGroup;
  availableMeasures: Measure[] = [];
  orderedSelectedMeasures: Measure[] = [];
  private tempMeasureIds: number[] = [];
  private isSubmitted = false;
  private subscription?: Subscription;
  private formSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<CreatePlanDialog>,
    private cdr: ChangeDetectorRef,
    public service: InstructionMenuService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.orderedSelectedMeasures = [...(data?.plan?.measures || [])];
    this.planForm = this.fb.group({
      name: [data?.plan?.name || '', Validators.required],
      selectedMeasures: [this.orderedSelectedMeasures]
    });
  }

  ngOnInit() {
    this.subscription = this.service.availableMeasures$.subscribe(measures => {
      this.availableMeasures = measures;
      this.cdr.detectChanges();
    });

    this.formSubscription = this.planForm.get('selectedMeasures')?.valueChanges.subscribe((selected: Measure[]) => {
      if (!selected) return;
      
      // Remove deselected measures
      this.orderedSelectedMeasures = this.orderedSelectedMeasures.filter(m => 
        selected.some(s => this.compareMeasures(s, m))
      );
      
      // Add newly selected measures at the end
      const newMeasures = selected.filter(s => 
        !this.orderedSelectedMeasures.some(m => this.compareMeasures(s, m))
      );
      this.orderedSelectedMeasures.push(...newMeasures);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.formSubscription?.unsubscribe();
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
      selectedMeasures: this.orderedSelectedMeasures
    });
  }

  drop(event: CdkDragDrop<Measure[]>) {
    moveItemInArray(this.orderedSelectedMeasures, event.previousIndex, event.currentIndex);
  }

  compareMeasures(o1: Measure, o2: Measure): boolean {
    return o1 && o2 ? o1.id === o2.id : o1 === o2;
  }
}
