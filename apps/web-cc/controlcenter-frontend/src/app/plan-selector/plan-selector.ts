import { Component, OnInit, OnDestroy, inject, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { PreviewPlanDialog } from '../instruction-menu/dialogs/preview-plan-dialog/preview-plan-dialog';
import { PreviewMeasureDialog } from '../instruction-menu/dialogs/preview-measure-dialog/preview-measure-dialog';
import { SignalingService } from '../services/signaling.service';
import { FlowStep, InstructionFlowService } from '../services/instruction-flow.service';
import { environment } from '../../environments/environment';
import { openDialogFromTrigger } from '../utils/dialog-origin.util';

export type FilterCategory = 'all' | 'plans' | 'measures';

@Component({
  selector: 'app-plan-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatIcon,
    MatButton,
    MatIconButton,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './plan-selector.html',
  styleUrl: './plan-selector.scss',
})
export class PlanSelector implements OnInit, OnDestroy {
  @ViewChild('catalogSearchInput') catalogSearchInput?: ElementRef<HTMLInputElement>;

  // Persisted UI state across component lifecycles / tab switching
  private static savedSearchTerm = '';
  private static savedFilterCategory: FilterCategory = 'all';

  private service = inject(InstructionMenuService);
  private dialog = inject(MatDialog);
  private signaling = inject(SignalingService);
  readonly flow = inject(InstructionFlowService);
  private subscriptions = new Subscription();
  private dispatchTimer: any = null;
  private advanceTimer: any = null;

  // Catalog Data from service
  allPlans: Plan[] = [];
  allMeasures: Measure[] = [];

  // Filtered catalog
  filteredPlans: Plan[] = [];
  filteredMeasures: Measure[] = [];

  // UI state
  searchTerm = PlanSelector.savedSearchTerm;
  filterCategory: FilterCategory = PlanSelector.savedFilterCategory;

  // Feedback banner
  dispatchNotice: string | null = null;
  dispatchError = false;
  advancePending = false;

  ngOnInit(): void {
    this.service.fetchInitialData();
    this.signaling.connect(environment.signalingUrl, 'controlcenter');

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
    if (this.dispatchTimer) clearTimeout(this.dispatchTimer);
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isEditable =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      !!target?.isContentEditable;

    if (!isEditable && event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const inputEl = this.catalogSearchInput?.nativeElement;
      if (inputEl && inputEl.offsetParent !== null) {
        event.preventDefault();
        inputEl.focus();
        inputEl.select();
      }
    } else if (event.key === 'Escape' && this.searchTerm) {
      event.preventDefault();
      this.clearSearch();
    }
  }

  private syncSavedState(): void {
    PlanSelector.savedSearchTerm = this.searchTerm;
    PlanSelector.savedFilterCategory = this.filterCategory;
  }

  // ── Filtering (Search indexes name, description and assigned tags) ──
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
        p.tags?.some((t) => t.toLowerCase().includes(term)) ||
        p.measures?.some(
          (m) =>
            m.name.toLowerCase().includes(term) ||
            m.tags?.some((t) => t.toLowerCase().includes(term)),
        ),
    );

    this.filteredMeasures = this.allMeasures.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.tags?.some((t) => t.toLowerCase().includes(term)),
    );
  }

  setFilterCategory(cat: FilterCategory): void {
    this.filterCategory = cat;
    this.syncSavedState();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ── Live-Warteschlange ──────────────────────────────────────────────
  /** Jede hinzugefügte Maßnahme / jeder Plan geht sofort an den Ersthelfer. */
  addToQueue(
    type: 'plan' | 'measure',
    rawItem: Plan | Measure,
    event?: Event,
    index?: number,
  ): void {
    event?.stopPropagation();

    if (type === 'plan') {
      const plan = rawItem as Plan;
      if (!plan.measures?.length) {
        this.showDispatchNotice(`Der Plan „${plan.name}“ enthält keine Maßnahmen.`, true);
        return;
      }
      this.flow.addPlan(plan, index);
    } else {
      this.flow.addMeasure(rawItem as Measure, index);
    }

    if (!this.flow.canReachMobile) {
      this.showDispatchNotice(
        'Keine aktive Verbindung zum Ersthelfer – die Schritte werden übertragen, sobald der Videoanruf steht.',
        true,
      );
    }
  }

  removeFromQueue(step: FlowStep, event?: Event): void {
    event?.stopPropagation();
    this.flow.removePending(step.uid);
  }

  removePlanGroup(step: FlowStep, event?: Event): void {
    event?.stopPropagation();
    if (step.planInstanceId) this.flow.removePlanInstance(step.planInstanceId);
  }

  clearQueue(): void {
    this.flow.clearPending();
  }

  onQueueDrop(event: CdkDragDrop<FlowStep[]>): void {
    if (event.previousContainer === event.container) {
      this.flow.movePending(event.previousIndex, event.currentIndex);
      return;
    }

    // Aus dem Katalog in die Warteschlange gezogen -> sofort an den Ersthelfer übergeben
    const rawData = event.item.data;
    if (!rawData) return;
    const type: 'plan' | 'measure' = rawData.measures !== undefined ? 'plan' : 'measure';
    this.addToQueue(type, rawData, undefined, event.currentIndex);
  }

  isCurrent(step: FlowStep): boolean {
    return this.flow.currentStep()?.uid === step.uid;
  }

  /** Ob ein Schritt die erste Zeile seiner Plan-Gruppe in der offenen Liste ist */
  isPlanGroupStart(index: number): boolean {
    const list = this.flow.pendingSteps();
    const step = list[index];
    if (!step?.planInstanceId) return false;
    return list[index - 1]?.planInstanceId !== step.planInstanceId;
  }

  countInQueue(type: 'plan' | 'measure', id: number): number {
    const steps = [...this.flow.completedSteps(), ...this.flow.pendingSteps()];
    if (type === 'measure') {
      return steps.filter((s) => !s.planInstanceId && s.measureId === id).length;
    }
    return new Set(steps.filter((s) => s.planId === id).map((s) => s.planInstanceId)).size;
  }

  get progressPercent(): number {
    const total = this.flow.totalSteps();
    if (total === 0) return 0;
    return Math.round((this.flow.completedSteps().length / total) * 100);
  }

  formatTime(iso?: string): string {
    if (!iso) return '–';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '–';
    return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ── Full Preview Dialogs ────────────────────────────────────────────
  previewPlan(plan: Plan, event?: Event): void {
    event?.stopPropagation();
    openDialogFromTrigger(
      this.dialog,
      PreviewPlanDialog,
      {
        width: '650px',
        panelClass: 'preview-plan-dialog',
        data: { plan, isSelected: this.countInQueue('plan', plan.id) > 0 },
      },
      event,
    );
  }

  previewMeasure(measure: Measure, event?: Event): void {
    event?.stopPropagation();
    openDialogFromTrigger(
      this.dialog,
      PreviewMeasureDialog,
      {
        width: '550px',
        panelClass: 'preview-measure-dialog',
        data: {
          measure,
          isSelected: this.countInQueue('measure', measure.id) > 0,
          toggleSelection: true,
        },
      },
      event,
    );
  }

  // ── Fernsteuerung ───────────────────────────────────────────────────
  get canAdvanceInstruction(): boolean {
    return this.flow.canReachMobile && !!this.flow.currentStep() && !this.advancePending;
  }

  advanceMobileInstruction(): void {
    if (!this.canAdvanceInstruction) return;
    this.advancePending = true;
    this.flow.requestAdvance();
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => (this.advancePending = false), 1500);
  }

  dismissNotice(): void {
    this.dispatchNotice = null;
    if (this.dispatchTimer) {
      clearTimeout(this.dispatchTimer);
      this.dispatchTimer = null;
    }
  }

  private showDispatchNotice(msg: string, isError = false): void {
    this.dispatchNotice = msg;
    this.dispatchError = isError;

    if (this.dispatchTimer) clearTimeout(this.dispatchTimer);
    this.dispatchTimer = setTimeout(() => {
      this.dispatchNotice = null;
      this.dispatchTimer = null;
    }, 6000);
  }
}
