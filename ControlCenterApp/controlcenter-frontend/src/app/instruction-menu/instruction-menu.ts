import { Component, ChangeDetectorRef } from '@angular/core';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { AuthService } from '../services/auth.service';

// Import Dialogs
import { CreateMeasureDialog } from './dialogs/create-measure-dialog/create-measure-dialog';
import { CreatePlanDialog } from './dialogs/create-plan-dialog/create-plan-dialog';
import { PreviewPlanDialog } from './dialogs/preview-plan-dialog/preview-plan-dialog';

@Component({
  selector: 'app-instruction-menu',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatList,
    MatListItem,
    MatButton,
    MatCardTitle,
    MatDialogModule,
    CommonModule
  ],
  templateUrl: './instruction-menu.html',
  styleUrl: './instruction-menu.scss',
})
export class InstructionMenu {
  expandedDescriptions: { [key: number]: boolean } = {};

  constructor(
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private service: InstructionMenuService,
    private auth: AuthService,
    private router: Router
  ) {}

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

  previewPlan(plan: Plan): void {
    this.dialog.open(PreviewPlanDialog, {
      width: '600px',
      data: { plan }
    });
  }
}
