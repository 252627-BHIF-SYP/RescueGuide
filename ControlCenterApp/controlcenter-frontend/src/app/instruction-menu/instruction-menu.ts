import { Component, Inject, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatDivider} from '@angular/material/divider';
import {MatList, MatListItem} from '@angular/material/list';
import {MatButton} from '@angular/material/button';
import {MatDialog, MatDialogModule, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatListModule} from '@angular/material/list';
import {Router} from '@angular/router';
import {InstructionMenuService, Measure, Plan} from '../services/instruction-menu.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-instruction-menu',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatDivider,
    MatList,
    MatListItem,
    MatButton,
    MatCardTitle,
    MatDialogModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './instruction-menu.html',
  styleUrl: './instruction-menu.scss',
})
export class InstructionMenu {
  expandedDescriptions: { [key: number]: boolean } = {};

  constructor(
    private dialog: MatDialog,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private service: InstructionMenuService,
    private auth: AuthService,
    private router: Router
  ) {}

  get status(): string {
    return this.auth.available() ? 'Verfügbar' : 'Abwesend';
  }

  get statusColor(): string {
    return this.auth.available() ? 'primary' : 'warn';
  }

  get statusIcon(): string {
    return this.auth.available() ? 'person' : 'person_off';
  }

  toggleStatus(): void {
    this.auth.toggleAvailability();
    this.cdr.markForCheck();
  }

  get availableMeasures(): Measure[] {
    return this.service.availableMeasures;
  }

  get plans(): Plan[] {
    return this.service.plans;
  }

  get currentMeasures(): Measure[] {
    return this.service.currentMeasures;
  }

  addMeasure(measure: Measure): void {
    this.service.addMeasure(measure);
    this.cdr.markForCheck();
  }

  removeMeasure(measure: Measure): void {
    this.service.removeMeasure(measure);
    this.cdr.markForCheck();
  }

  toggleDescription(id: number) {
    this.expandedDescriptions[id] = !this.expandedDescriptions[id];
    this.cdr.markForCheck();
  }

  createMeasure(): void {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newMeasure = this.service.createMeasure(result.name, result.description, result.imageUrl);
        this.addMeasure(newMeasure);
      }
    });
  }

  editMeasure(measure: Measure): void {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '400px',
      data: { measure }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.editMeasure(measure, result.name, result.description, result.imageUrl);
        this.cdr.markForCheck();
      }
    });
  }

  deleteMeasure(measure: Measure): void {
    this.service.deleteMeasure(measure);
    this.cdr.markForCheck();
  }

  createPlan(): void {
    const dialogRef = this.dialog.open(CreatePlanDialog, {
      width: '600px',
      data: { availableMeasures: this.availableMeasures }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createPlan(result.name, result.selectedMeasures);
        this.cdr.markForCheck();
      }
    });
  }

  editPlan(plan: Plan): void {
    const dialogRef = this.dialog.open(CreatePlanDialog, {
      width: '600px',
      data: { availableMeasures: this.availableMeasures, plan }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.editPlan(plan, result.name, result.selectedMeasures);
        this.cdr.markForCheck();
      }
    });
  }

  deletePlan(plan: Plan): void {
    this.service.deletePlan(plan);
    this.cdr.markForCheck();
  }
}

// Dialog Components
@Component({
  selector: 'create-measure-dialog',
  template: `
    <h2 mat-dialog-title>
      @if (data?.measure) { Maßnahme bearbeiten } @else { Neue Maßnahme erstellen }
    </h2>
    <mat-dialog-content>
      <form [formGroup]="measureForm">
        @if (data?.measure) {
          <mat-form-field appearance="fill" class="full-width read-only-field">
            <mat-label>Author</mat-label>
            <input matInput [value]="data.measure.author" disabled>
          </mat-form-field>
          <mat-form-field appearance="fill" class="full-width read-only-field">
            <mat-label>Erstellt am</mat-label>
            <input matInput [value]="data.measure.createdAt | date:'short'" disabled>
          </mat-form-field>
        }
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Beschreibung</mat-label>
          <textarea matInput formControlName="description"></textarea>
        </mat-form-field>
        <div class="file-upload-row">
          <button mat-stroked-button type="button" (click)="triggerFileSelect()">
            Bild/GIF auswählen
          </button>
          <input type="file" #fileInput accept="image/*,.svg,.webp,.bmp,.ico,.avif" style="display:none" (change)="onImageSelected($event)">
        </div>
        @if (imagePreview) {
          <img class="preview-image" [src]="imagePreview" alt="Vorschau der Maßnahme">
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="measureForm.value" [disabled]="!measureForm.valid">
        @if (data?.measure) { Speichern } @else { Erstellen }
      </button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; }', '.read-only-field .mat-input-element { color: rgba(0, 0, 0, 0.6); }', '.preview-image { max-width: 100%; max-height: 220px; margin-top: 12px; border-radius: 4px; }', '.file-upload-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }'],
  imports: [CommonModule, MatDialogModule, ReactiveFormsModule, MatButton, MatFormFieldModule, MatInputModule]
})
export class CreateMeasureDialog {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  measureForm: FormGroup;
  imagePreview?: string;

  constructor(private fb: FormBuilder, private cdr: ChangeDetectorRef, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.measureForm = this.fb.group({
      name: [data?.measure?.name || '', Validators.required],
      description: [data?.measure?.description || ''],
      imageUrl: [data?.measure?.imageUrl || '']
    });
    this.imagePreview = data?.measure?.imageUrl;
  }

  triggerFileSelect() {
    this.fileInput.nativeElement.click();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreview = result;
      this.measureForm.get('imageUrl')?.setValue(result);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }
}

@Component({
  selector: 'create-plan-dialog',
  template: `
    <h2 mat-dialog-title>Neuen Plan erstellen</h2>
    <mat-dialog-content>
      <form [formGroup]="planForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Plan Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <h3>Maßnahmen auswählen</h3>
        <mat-selection-list formControlName="selectedMeasures">
          @for (measure of data.availableMeasures; track measure.id) {
            <mat-list-option [value]="measure">
              {{ measure.name }}
            </mat-list-option>
          }
        </mat-selection-list>
        <button mat-stroked-button (click)="createNewMeasure()">Neue Maßnahme erstellen</button>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="getPlanData()" [disabled]="!planForm.valid">Erstellen</button>
    </mat-dialog-actions>
  `,
  styles: ['.full-width { width: 100%; }'],
  imports: [MatDialogModule, ReactiveFormsModule, MatButton, MatFormFieldModule, MatInputModule, MatListModule, CommonModule]
})
export class CreatePlanDialog {
  planForm: FormGroup;

  constructor(private fb: FormBuilder, private dialog: MatDialog, private cdr: ChangeDetectorRef, private service: InstructionMenuService, @Inject(MAT_DIALOG_DATA) public data: any) {
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
