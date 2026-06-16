import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { AuthService } from '../services/auth.service';
import { AlarmService } from '../services/alarm.service';

// Import Dialogs
import { CreateMeasureDialog } from './dialogs/create-measure-dialog/create-measure-dialog';
import { CreatePlanDialog } from './dialogs/create-plan-dialog/create-plan-dialog';
import { PreviewPlanDialog } from './dialogs/preview-plan-dialog/preview-plan-dialog';

@Component({
  selector: 'app-instruction-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './instruction-menu.html',
  styleUrl: './instruction-menu.scss',
})
export class InstructionMenu implements OnInit, OnDestroy {
  expandedDescriptions: { [key: number]: boolean } = {};

  private subscriptions: Subscription = new Subscription();

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private service: InstructionMenuService,
    private auth: AuthService,
    private alarmService: AlarmService,
    private router: Router
  ) {}

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
        this.service.createMeasure(result.name, result.description, result.imageUrl).subscribe({
          next: (newMeasure) => {
            this.addMeasure(newMeasure);
          },
          error: (err) => console.error('Failed to create measure', err)
        });
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
        this.service.editMeasure(measure, result.name, result.description, result.imageUrl).subscribe({
          next: () => this.cdr.markForCheck(),
          error: (err) => console.error('Failed to edit measure', err)
        });
      }
    });
  }

  deleteMeasure(measure: Measure): void {
    this.service.deleteMeasure(measure).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => console.error('Failed to delete measure', err)
    });
  }

  createPlan(): void {
    const dialogRef = this.dialog.open(CreatePlanDialog, {
      width: '600px',
      data: { availableMeasures: this.availableMeasures }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.createPlan(result.name, result.selectedMeasures).subscribe({
          next: () => this.cdr.markForCheck(),
          error: (err) => console.error('Failed to create plan', err)
        });
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
        this.service.editPlan(plan, result.name, result.selectedMeasures).subscribe({
          next: () => this.cdr.markForCheck(),
          error: (err) => console.error('Failed to edit plan', err)
        });
      }
    });
  }

  deletePlan(plan: Plan): void {
    this.service.deletePlan(plan).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => console.error('Failed to delete plan', err)
    });
  }

  previewPlan(plan: Plan): void {
    this.dialog.open(PreviewPlanDialog, {
      width: '600px',
      data: { plan }
    });
  }
}
