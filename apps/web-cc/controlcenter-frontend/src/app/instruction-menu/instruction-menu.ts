import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { AuthService } from '../services/auth.service';
import { AlarmService } from '../services/alarm.service';

// Import Dialogs
import { CreateMeasureDialog } from './dialogs/create-measure-dialog/create-measure-dialog';
import { CreatePlanDialog } from './dialogs/create-plan-dialog/create-plan-dialog';
import { PreviewPlanDialog } from './dialogs/preview-plan-dialog/preview-plan-dialog';
import { PreviewMeasureDialog } from './dialogs/preview-measure-dialog/preview-measure-dialog';
import { ConfirmDeleteDialog } from './dialogs/confirm-delete-dialog/confirm-delete-dialog';

@Component({
  selector: 'app-instruction-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './instruction-menu.html',
  styleUrl: './instruction-menu.scss',
})
export class InstructionMenu implements OnInit, OnDestroy {
  // Separate, independent search inputs
  planSearchTerm = '';
  measureSearchTerm = '';

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private service = inject(InstructionMenuService);
  private auth = inject(AuthService);
  private alarmService = inject(AlarmService);
  private router = inject(Router);

  private subscriptions: Subscription = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.service.availableMeasures$.subscribe(() => this.cdr.markForCheck())
    );
    this.subscriptions.add(
      this.service.plans$.subscribe(() => this.cdr.markForCheck())
    );
    this.service.fetchInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

  // ── Independent Filtering (Searches Name, Description & Tags) ──────
  get filteredPlans(): Plan[] {
    const term = this.planSearchTerm.toLowerCase().trim();
    if (!term) return this.plans;

    return this.plans.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.tags?.some(t => t.toLowerCase().includes(term)) ||
      p.measures?.some(m =>
        m.name.toLowerCase().includes(term) ||
        m.tags?.some(t => t.toLowerCase().includes(term))
      )
    );
  }

  get filteredMeasures(): Measure[] {
    const term = this.measureSearchTerm.toLowerCase().trim();
    if (!term) return this.availableMeasures;

    return this.availableMeasures.filter(m =>
      m.name.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term) ||
      m.tags?.some(t => t.toLowerCase().includes(term))
    );
  }

  clearPlanSearch(): void {
    this.planSearchTerm = '';
    this.cdr.markForCheck();
  }

  clearMeasureSearch(): void {
    this.measureSearchTerm = '';
    this.cdr.markForCheck();
  }

  // ── Actions ─────────────────────────────────────────────────────────
  addMeasure(measure: Measure): void {
    this.service.addMeasure(measure);
    this.cdr.markForCheck();
  }

  removeMeasure(measure: Measure): void {
    this.service.removeMeasure(measure);
    this.cdr.markForCheck();
  }

  createMeasure(): void {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '840px',
      maxWidth: '95vw',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createMeasure(result.name, result.description, result.imageUrl, result.tags).subscribe({
          next: (newMeasure) => {
            this.addMeasure(newMeasure);
            this.snackBar.open(`Sofortmaßnahme „${newMeasure.name}“ erstellt`, 'OK', {
              duration: 3500
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to create measure', err);
            this.snackBar.open('Fehler beim Erstellen der Maßnahme', 'Schließen', { duration: 4000 });
          }
        });
      }
    });
  }

  editMeasure(measure: Measure): void {
    const dialogRef = this.dialog.open(CreateMeasureDialog, {
      width: '840px',
      maxWidth: '95vw',
      data: { measure }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.editMeasure(measure, result.name, result.description, result.imageUrl, result.tags).subscribe({
          next: () => {
            this.snackBar.open(`Sofortmaßnahme „${result.name}“ gespeichert`, 'OK', {
              duration: 3500
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to edit measure', err);
            this.snackBar.open('Fehler beim Speichern der Maßnahme', 'Schließen', { duration: 4000 });
          }
        });
      }
    });
  }

  deleteMeasure(measure: Measure): void {
    const affectedPlans = this.plans.filter(p => p.measures?.some(m => m.id === measure.id));

    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '460px',
      data: {
        type: 'measure',
        name: measure.name,
        affectedPlansCount: affectedPlans.length,
        planNames: affectedPlans.map(p => p.name)
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.service.deleteMeasure(measure).subscribe({
        next: () => {
          this.snackBar.open(`Sofortmaßnahme „${measure.name}“ wurde gelöscht`, 'OK', {
            duration: 4000
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to delete measure', err);
          this.snackBar.open('Fehler beim Löschen der Maßnahme', 'Schließen', { duration: 4000 });
        }
      });
    });
  }

  createPlan(): void {
    const dialogRef = this.dialog.open(CreatePlanDialog, {
      width: '840px',
      maxWidth: '95vw',
      data: { availableMeasures: this.availableMeasures }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createPlan(result.name, result.selectedMeasures, result.tags).subscribe({
          next: (newPlan) => {
            this.snackBar.open(`Einsatzplan „${newPlan.name}“ erfolgreich erstellt`, 'OK', {
              duration: 3500
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to create plan', err);
            this.snackBar.open('Fehler beim Erstellen des Plans', 'Schließen', { duration: 4000 });
          }
        });
      }
    });
  }

  editPlan(plan: Plan): void {
    const dialogRef = this.dialog.open(CreatePlanDialog, {
      width: '840px',
      maxWidth: '95vw',
      data: { availableMeasures: this.availableMeasures, plan }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.editPlan(plan, result.name, result.selectedMeasures, result.tags).subscribe({
          next: () => {
            this.snackBar.open(`Einsatzplan „${result.name}“ aktualisiert`, 'OK', {
              duration: 3500
            });
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error('Failed to edit plan', err);
            this.snackBar.open('Fehler beim Aktualisieren des Plans', 'Schließen', { duration: 4000 });
          }
        });
      }
    });
  }

  deletePlan(plan: Plan): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialog, {
      width: '460px',
      data: {
        type: 'plan',
        name: plan.name
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.service.deletePlan(plan).subscribe({
        next: () => {
          this.snackBar.open(`Einsatzplan „${plan.name}“ wurde gelöscht`, 'OK', {
            duration: 4000
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Failed to delete plan', err);
          this.snackBar.open('Fehler beim Löschen des Plans', 'Schließen', { duration: 4000 });
        }
      });
    });
  }

  previewPlan(plan: Plan): void {
    this.dialog.open(PreviewPlanDialog, {
      width: '650px',
      data: { plan }
    });
  }

  previewMeasure(measure: Measure): void {
    this.dialog.open(PreviewMeasureDialog, {
      width: '550px',
      data: { measure }
    });
  }
}
