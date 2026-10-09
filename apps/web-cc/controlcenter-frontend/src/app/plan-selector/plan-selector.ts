import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButton,
    MatIconButton
  ],
  templateUrl: './plan-selector.html',
  styleUrl: './plan-selector.scss'
})
export class PlanSelector implements OnInit, OnDestroy {
  private service = inject(InstructionMenuService);
  private subscriptions = new Subscription();

  // Data from service
  allPlans: Plan[] = [];
  allMeasures: Measure[] = [];

  // Filtered lists
  filteredPlans: Plan[] = [];
  filteredMeasures: Measure[] = [];

  // Selection state
  selectedPlans: Plan[] = [];
  selectedMeasures: Measure[] = [];

  // UI state
  searchTerm = '';
  expandedPlans: { [planId: number]: boolean } = {};

  ngOnInit(): void {
    this.service.fetchInitialData();

    this.subscriptions.add(
      this.service.plans$.subscribe(plans => {
        this.allPlans = plans;
        this.applyFilter();
      })
    );

    this.subscriptions.add(
      this.service.availableMeasures$.subscribe(measures => {
        this.allMeasures = measures;
        this.applyFilter();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredPlans = [...this.allPlans];
      this.filteredMeasures = [...this.allMeasures];
      return;
    }

    this.filteredPlans = this.allPlans.filter(
      p => p.name.toLowerCase().includes(term) ||
           p.measures.some(m => m.name.toLowerCase().includes(term))
    );

    this.filteredMeasures = this.allMeasures.filter(
      m => m.name.toLowerCase().includes(term) ||
           m.description?.toLowerCase().includes(term)
    );
  }

  // ── Plan selection ──────────────────────────────────────────────────

  isPlanSelected(plan: Plan): boolean {
    return this.selectedPlans.some(p => p.id === plan.id);
  }

  togglePlanSelection(plan: Plan): void {
    if (this.isPlanSelected(plan)) {
      this.selectedPlans = this.selectedPlans.filter(p => p.id !== plan.id);
    } else {
      this.selectedPlans = [...this.selectedPlans, plan];
    }
  }

  togglePlanExpand(planId: number): void {
    this.expandedPlans[planId] = !this.expandedPlans[planId];
  }

  // ── Measure selection ───────────────────────────────────────────────

  isMeasureSelected(measure: Measure): boolean {
    return this.selectedMeasures.some(m => m.id === measure.id);
  }

  toggleMeasureSelection(measure: Measure): void {
    if (this.isMeasureSelected(measure)) {
      this.selectedMeasures = this.selectedMeasures.filter(m => m.id !== measure.id);
    } else {
      this.selectedMeasures = [...this.selectedMeasures, measure];
    }
  }

  // ── Send action (stub) ─────────────────────────────────────────────

  hasSelection(): boolean {
    return this.selectedPlans.length > 0 || this.selectedMeasures.length > 0;
  }

  sendSelection(): void {
    // TODO: Implement actual sending logic (e.g. via WebSocket/SignalR to mobile app)
    console.log('Sending selection to first responder:');
    console.log('Plans:', this.selectedPlans);
    console.log('Measures:', this.selectedMeasures);

    // For now, just log – real implementation comes later
    alert(`Sende ${this.selectedPlans.length} Plan/Pläne und ${this.selectedMeasures.length} Maßnahme(n) an den Ersthelfer.\n\n(Funktionalität wird später ergänzt)`);
  }
}
