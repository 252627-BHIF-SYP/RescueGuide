import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { PreviewPlanDialog } from '../instruction-menu/dialogs/preview-plan-dialog/preview-plan-dialog';
import { PreviewMeasureDialog } from '../instruction-menu/dialogs/preview-measure-dialog/preview-measure-dialog';
import { SignalingService } from '../services/signaling.service';
import { CallContextService } from '../services/call-context.service';
import { environment } from '../../environments/environment';

export type FilterTab = 'all' | 'plans' | 'measures' | 'selected';

interface DispatchProgress {
  completedCount: number;
  totalSteps: number;
  currentTitle: string;
  complete: boolean;
}

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIcon,
    MatCard,
    MatCardContent,
    MatCheckboxModule,
    MatButton,
    MatIconButton,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './plan-selector.html',
  styleUrl: './plan-selector.scss',
})
export class PlanSelector implements OnInit, OnDestroy {
  // Persisted state across component lifecycles
  private static savedSelectedPlans: Plan[] = [];
  private static savedSelectedMeasures: Measure[] = [];
  private static savedSearchTerm = '';
  private static savedActiveFilterTab: FilterTab = 'all';

  private service = inject(InstructionMenuService);
  private dialog = inject(MatDialog);
  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);
  private subscriptions = new Subscription();
  private dispatchTimer: any = null;

  // Data from service
  allPlans: Plan[] = [];
  allMeasures: Measure[] = [];

  // Filtered lists
  filteredPlans: Plan[] = [];
  filteredMeasures: Measure[] = [];

  // Selection state (restored from saved state)
  selectedPlans: Plan[] = [...PlanSelector.savedSelectedPlans];
  selectedMeasures: Measure[] = [...PlanSelector.savedSelectedMeasures];

  // UI state (restored from saved state)
  searchTerm = PlanSelector.savedSearchTerm;
  activeFilterTab: FilterTab = PlanSelector.savedActiveFilterTab;
  expandedPlans: { [planId: number]: boolean } = {};
  expandedMeasures: { [measureId: number]: boolean } = {};

  // Feedback banner state
  dispatchNotice: string | null = null;
  dispatchError = false;
  dispatchProgress: DispatchProgress | null = null;
  private readonly onInstructionProgress = (payload: any) => {
    if (payload?.from !== this.callContext.getActiveCallId() || !payload.progress) return;
    this.dispatchProgress = payload.progress as DispatchProgress;
  };

  ngOnInit(): void {
    this.service.fetchInitialData();
    this.signaling.connect(environment.signalingUrl, 'controlcenter');
    this.signaling.on('instruction-progress', this.onInstructionProgress);

    this.subscriptions.add(
      this.service.plans$.subscribe((plans) => {
        this.allPlans = plans || [];
        this.applyFilter();
      }),
    );

    this.subscriptions.add(
      this.service.availableMeasures$.subscribe((measures) => {
        this.allMeasures = measures || [];
        this.applyFilter();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.signaling.off('instruction-progress', this.onInstructionProgress);
    if (this.dispatchTimer) {
      clearTimeout(this.dispatchTimer);
    }
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      if (this.hasSelection) {
        event.preventDefault();
        this.sendSelection();
      }
    } else if (event.key === 'Escape' && this.searchTerm) {
      event.preventDefault();
      this.clearSearch();
    }
  }

  private syncSavedState(): void {
    PlanSelector.savedSelectedPlans = [...this.selectedPlans];
    PlanSelector.savedSelectedMeasures = [...this.selectedMeasures];
    PlanSelector.savedSearchTerm = this.searchTerm;
    PlanSelector.savedActiveFilterTab = this.activeFilterTab;
  }

  // ── Filtering ───────────────────────────────────────────────────────
  applyFilter(): void {
    this.syncSavedState();
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredPlans = [...this.allPlans];
      this.filteredMeasures = [...this.allMeasures];
      return;
    }

    this.filteredPlans = this.allPlans.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.measures?.some((m) => m.name.toLowerCase().includes(term)),
    );

    this.filteredMeasures = this.allMeasures.filter(
      (m) => m.name.toLowerCase().includes(term) || m.description?.toLowerCase().includes(term),
    );
  }

  setFilterTab(tab: FilterTab): void {
    this.activeFilterTab = tab;
    this.syncSavedState();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ── Computed helpers ────────────────────────────────────────────────
  get totalSelectedCount(): number {
    return this.selectedPlans.length + this.selectedMeasures.length;
  }

  get hasSelection(): boolean {
    return this.totalSelectedCount > 0;
  }

  /**
   * Set of measure IDs already included in any of the currently selected plans.
   */
  get measuresInSelectedPlans(): Set<number> {
    const set = new Set<number>();
    for (const plan of this.selectedPlans) {
      for (const m of plan.measures || []) {
        set.add(m.id);
      }
    }
    return set;
  }

  isMeasureInSelectedPlan(measureId: number): boolean {
    return this.measuresInSelectedPlans.has(measureId);
  }

  // Visible lists based on active tab
  get shouldShowPlans(): boolean {
    return (
      this.activeFilterTab === 'all' ||
      this.activeFilterTab === 'plans' ||
      this.activeFilterTab === 'selected'
    );
  }

  get shouldShowMeasures(): boolean {
    return (
      this.activeFilterTab === 'all' ||
      this.activeFilterTab === 'measures' ||
      this.activeFilterTab === 'selected'
    );
  }

  get displayedPlans(): Plan[] {
    if (this.activeFilterTab === 'selected') {
      const term = this.searchTerm.toLowerCase().trim();
      return this.selectedPlans.filter((p) => !term || p.name.toLowerCase().includes(term));
    }
    return this.filteredPlans;
  }

  get displayedMeasures(): Measure[] {
    if (this.activeFilterTab === 'selected') {
      const term = this.searchTerm.toLowerCase().trim();
      return this.selectedMeasures.filter(
        (m) =>
          !term ||
          m.name.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term),
      );
    }
    return this.filteredMeasures;
  }

  get isCurrentTabEmpty(): boolean {
    if (this.activeFilterTab === 'all') {
      return this.displayedPlans.length === 0 && this.displayedMeasures.length === 0;
    }
    if (this.activeFilterTab === 'plans') {
      return this.displayedPlans.length === 0;
    }
    if (this.activeFilterTab === 'measures') {
      return this.displayedMeasures.length === 0;
    }
    if (this.activeFilterTab === 'selected') {
      return this.totalSelectedCount === 0;
    }
    return false;
  }

  // ── Plan selection ──────────────────────────────────────────────────
  isPlanSelected(plan: Plan): boolean {
    return this.selectedPlans.some((p) => p.id === plan.id);
  }

  togglePlanSelection(plan: Plan, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isPlanSelected(plan)) {
      this.selectedPlans = this.selectedPlans.filter((p) => p.id !== plan.id);
    } else {
      this.selectedPlans = [...this.selectedPlans, plan];
    }
    this.syncSavedState();
  }

  togglePlanExpand(planId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedPlans[planId] = !this.expandedPlans[planId];
  }

  // ── Measure selection ───────────────────────────────────────────────
  isMeasureSelected(measure: Measure): boolean {
    return this.selectedMeasures.some((m) => m.id === measure.id);
  }

  toggleMeasureSelection(measure: Measure, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isMeasureSelected(measure)) {
      this.selectedMeasures = this.selectedMeasures.filter((m) => m.id !== measure.id);
    } else {
      this.selectedMeasures = [...this.selectedMeasures, measure];
    }
    this.syncSavedState();
  }

  toggleMeasureExpand(measureId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedMeasures[measureId] = !this.expandedMeasures[measureId];
  }

  clearAllSelection(): void {
    this.selectedPlans = [];
    this.selectedMeasures = [];
    this.syncSavedState();
  }

  // ── Dialog Previews ─────────────────────────────────────────────────
  previewPlan(plan: Plan, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.dialog.open(PreviewPlanDialog, {
      width: '650px',
      panelClass: 'preview-plan-dialog',
      data: {
        plan,
        isSelected: this.isPlanSelected(plan),
        toggleSelection: () => this.togglePlanSelection(plan),
      },
    });
  }

  previewMeasure(measure: Measure, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.dialog.open(PreviewMeasureDialog, {
      width: '560px',
      panelClass: 'preview-measure-dialog',
      data: {
        measure,
        isSelected: this.isMeasureSelected(measure),
        toggleSelection: () => this.toggleMeasureSelection(measure),
      },
    });
  }

  // ── Send action ────────────────────────────────────────────────────
  sendSelection(): void {
    if (!this.hasSelection) return;

    const targetId = this.callContext.getActiveCallId();
    if (!targetId || !this.signaling.isConnected) {
      this.showDispatchNotice('Keine aktive Handyverbindung zur Leitstelle.', true);
      return;
    }

    const items = new Map<
      number,
      { id: number; name: string; description: string; imageUrl?: string; planName?: string }
    >();
    for (const plan of this.selectedPlans) {
      for (const measure of plan.measures ?? []) {
        if (!items.has(measure.id)) items.set(measure.id, { ...measure, planName: plan.name });
      }
    }
    for (const measure of this.selectedMeasures) {
      if (!items.has(measure.id)) items.set(measure.id, { ...measure });
    }

    const steps = [...items.values()];
    if (steps.length === 0) {
      this.showDispatchNotice('Die Auswahl enthält keine Maßnahmen zum Übermitteln.', true);
      return;
    }

    const title = this.selectedPlans.map((plan) => plan.name).join(', ') || 'Sofortmaßnahmen';
    this.signaling.emit('instruction-plan', {
      from: 'controlcenter',
      to: targetId,
      plan: { title, items: steps },
    });
    this.dispatchProgress = {
      completedCount: 0,
      totalSteps: steps.length,
      currentTitle: steps[0].name,
      complete: false,
    };
    this.dispatchError = false;

    const plansCount = this.selectedPlans.length;
    const measuresCount = this.selectedMeasures.length;

    const parts: string[] = [];
    if (plansCount > 0) {
      parts.push(`${plansCount} ${plansCount === 1 ? 'Plan' : 'Pläne'}`);
    }
    if (measuresCount > 0) {
      parts.push(`${measuresCount} ${measuresCount === 1 ? 'Maßnahme' : 'Maßnahmen'}`);
    }

    this.showDispatchNotice(
      `Übermittelt: ${parts.join(' und ')}. Fortschritt wird angezeigt.`,
      false,
    );
  }

  get progressPercent(): number {
    if (!this.dispatchProgress || this.dispatchProgress.totalSteps === 0) return 0;
    return Math.round(
      (this.dispatchProgress.completedCount / this.dispatchProgress.totalSteps) * 100,
    );
  }

  private showDispatchNotice(message: string, isError: boolean): void {
    this.dispatchNotice = message;
    this.dispatchError = isError;

    if (this.dispatchTimer) {
      clearTimeout(this.dispatchTimer);
    }
    this.dispatchTimer = setTimeout(() => {
      this.dispatchNotice = null;
      this.dispatchTimer = null;
    }, 4500);
  }

  dismissNotice(): void {
    this.dispatchNotice = null;
    if (this.dispatchTimer) {
      clearTimeout(this.dispatchTimer);
      this.dispatchTimer = null;
    }
  }
}
