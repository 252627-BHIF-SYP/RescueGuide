import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InstructionMenuService, Measure, Plan } from '../services/instruction-menu.service';
import { PreviewPlanDialog } from '../instruction-menu/dialogs/preview-plan-dialog/preview-plan-dialog';
import { PreviewMeasureDialog } from '../instruction-menu/dialogs/preview-measure-dialog/preview-measure-dialog';
import { SignalingService } from '../services/signaling.service';
import { CallContextService } from '../services/call-context.service';
import { environment } from '../../environments/environment';

export type FilterCategory = 'all' | 'plans' | 'measures';

export interface QueueItem {
  uid: string;
  type: 'plan' | 'measure';
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  plan?: Plan;
  measure?: Measure;
  stepsCount: number;
}

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
  // Persisted state across component lifecycles / tab switching
  private static savedQueue: QueueItem[] = [];
  private static savedSearchTerm = '';
  private static savedFilterCategory: FilterCategory = 'all';

  private service = inject(InstructionMenuService);
  private dialog = inject(MatDialog);
  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);
  private subscriptions = new Subscription();
  private dispatchTimer: any = null;

  // Catalog Data from service
  allPlans: Plan[] = [];
  allMeasures: Measure[] = [];

  // Filtered catalog
  filteredPlans: Plan[] = [];
  filteredMeasures: Measure[] = [];

  // Warteschlange (Queue)
  queue: QueueItem[] = [...PlanSelector.savedQueue];

  // UI state
  searchTerm = PlanSelector.savedSearchTerm;
  filterCategory: FilterCategory = PlanSelector.savedFilterCategory;

  // Feedback banner & dispatch progress
  dispatchNotice: string | null = null;
  dispatchError = false;
  dispatchProgress: DispatchProgress | null = null;
  advancePending = false;

  private readonly onInstructionProgress = (payload: any) => {
    if (payload?.from !== this.callContext.getActiveCallId() || !payload.progress) return;
    this.dispatchProgress = payload.progress as DispatchProgress;
    this.advancePending = false;
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
      if (this.queue.length > 0) {
        event.preventDefault();
        this.sendQueue();
      }
    } else if (event.key === 'Escape' && this.searchTerm) {
      event.preventDefault();
      this.clearSearch();
    }
  }

  private syncSavedState(): void {
    PlanSelector.savedQueue = [...this.queue];
    PlanSelector.savedSearchTerm = this.searchTerm;
    PlanSelector.savedFilterCategory = this.filterCategory;
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

  setFilterCategory(cat: FilterCategory): void {
    this.filterCategory = cat;
    this.syncSavedState();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  // ── Warteschlange (Queue) Operations ────────────────────────────────
  addToQueue(type: 'plan' | 'measure', rawItem: Plan | Measure, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const uid = `${type}-${rawItem.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (type === 'plan') {
      const plan = rawItem as Plan;
      this.queue.push({
        uid,
        type: 'plan',
        id: plan.id,
        name: plan.name,
        plan,
        stepsCount: plan.measures?.length || 0,
      });
    } else {
      const measure = rawItem as Measure;
      this.queue.push({
        uid,
        type: 'measure',
        id: measure.id,
        name: measure.name,
        description: measure.description,
        imageUrl: measure.imageUrl,
        measure,
        stepsCount: 1,
      });
    }

    this.syncSavedState();
  }

  removeFromQueue(index: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.queue.splice(index, 1);
    this.syncSavedState();
  }

  clearQueue(): void {
    this.queue = [];
    this.syncSavedState();
  }

  onQueueDrop(event: CdkDragDrop<QueueItem[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within queue
      moveItemInArray(this.queue, event.previousIndex, event.currentIndex);
      this.syncSavedState();
    } else {
      // Dropped from catalog into queue
      const rawData = event.item.data;
      if (rawData) {
        const type: 'plan' | 'measure' = rawData.measures !== undefined ? 'plan' : 'measure';
        const uid = `${type}-${rawData.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newItem: QueueItem =
          type === 'plan'
            ? {
                uid,
                type: 'plan',
                id: rawData.id,
                name: rawData.name,
                plan: rawData,
                stepsCount: rawData.measures?.length || 0,
              }
            : {
                uid,
                type: 'measure',
                id: rawData.id,
                name: rawData.name,
                description: rawData.description,
                imageUrl: rawData.imageUrl,
                measure: rawData,
                stepsCount: 1,
              };

        this.queue.splice(event.currentIndex, 0, newItem);
        this.syncSavedState();
      }
    }
  }

  // Count occurrences of an item in the queue
  countInQueue(type: 'plan' | 'measure', id: number): number {
    return this.queue.filter((q) => q.type === type && q.id === id).length;
  }

  get totalStepsInQueue(): number {
    return this.queue.reduce((acc, curr) => acc + curr.stepsCount, 0);
  }

  // ── Full Preview Dialogs ────────────────────────────────────────────
  previewPlan(plan: Plan, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    this.dialog.open(PreviewPlanDialog, {
      width: '650px',
      panelClass: 'preview-plan-dialog',
      data: {
        plan,
        isSelected: this.countInQueue('plan', plan.id) > 0,
        toggleSelection: () => this.addToQueue('plan', plan),
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
        isSelected: this.countInQueue('measure', measure.id) > 0,
        toggleSelection: () => this.addToQueue('measure', measure),
      },
    });
  }

  // ── Send queue action ───────────────────────────────────────────────
  sendQueue(): void {
    if (this.queue.length === 0) return;

    const targetId = this.callContext.getActiveCallId();
    if (!targetId || !this.signaling.isConnected) {
      this.showDispatchNotice(
        'Keine aktive Verbindung zum Ersthelfer (Warte auf Videoanruf).',
        true,
      );
      return;
    }

    const steps: {
      id: number;
      name: string;
      description: string;
      imageUrl?: string;
      planName?: string;
    }[] = [];
    const titles: string[] = [];

    // Process queue in EXACT sequential order!
    for (const q of this.queue) {
      if (q.type === 'plan' && q.plan) {
        titles.push(q.plan.name);
        for (const m of q.plan.measures ?? []) {
          steps.push({ ...m, planName: q.plan.name });
        }
      } else if (q.type === 'measure' && q.measure) {
        titles.push(q.measure.name);
        steps.push({ ...q.measure });
      }
    }

    if (steps.length === 0) {
      this.showDispatchNotice('Die Warteschlange enthält keine ausführbaren Schritte.', true);
      return;
    }

    const title = titles.join(' ➔ ') || 'Einsatzmaßnahmen';
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
    this.advancePending = false;
    this.dispatchError = false;

    this.showDispatchNotice(
      `Warteschlange übermittelt: ${this.queue.length} Maßnahmen (${steps.length} Schritte in Reihenfolge).`,
      false,
    );
  }

  get progressPercent(): number {
    if (!this.dispatchProgress || this.dispatchProgress.totalSteps === 0) return 0;
    return Math.round(
      (this.dispatchProgress.completedCount / this.dispatchProgress.totalSteps) * 100,
    );
  }

  get canAdvanceInstruction(): boolean {
    return (
      this.signaling.isConnected &&
      !!this.callContext.getActiveCallId() &&
      !this.dispatchProgress?.complete &&
      !this.advancePending
    );
  }

  advanceMobileInstruction(): void {
    const targetId = this.callContext.getActiveCallId();
    if (!targetId || !this.canAdvanceInstruction) return;

    this.advancePending = true;
    this.signaling.emit('instruction-next', {
      from: 'controlcenter',
      to: targetId,
    });
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
