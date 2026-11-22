import { Injectable, computed, inject, signal } from '@angular/core';
import { Measure, Plan } from './instruction-menu.service';
import { SignalingService } from './signaling.service';
import { CallContextService } from './call-context.service';

/**
 * Ein einzelner Schritt im Live-Ablauf zwischen Leitstelle und Ersthelfer.
 * Pläne werden beim Hinzufügen in ihre einzelnen Maßnahmen aufgelöst, damit jeder
 * Schritt einzeln abgearbeitet und eingefroren werden kann.
 */
export interface FlowStep {
  uid: string;
  measureId: number;
  name: string;
  description: string;
  imageUrl?: string;
  tags: string[];
  measure: Measure;
  /** Gesetzt, wenn der Schritt aus einem Plan stammt */
  planId?: number;
  planName?: string;
  /** Eindeutige Kennung einer Plan-Übergabe (gleicher Plan kann mehrfach übergeben werden) */
  planInstanceId?: string;
  /** Zeitpunkt der Übergabe an den Ersthelfer (ISO) */
  addedAt: string;
  /** Zeitpunkt, an dem der Ersthelfer „Weiter“ gedrückt hat (ISO) – Schritt ist dann eingefroren */
  completedAt?: string;
}

/** Eintrag im persistierten Maßnahmenverlauf des Einsatzprotokolls */
export interface InstructionHistoryEntry {
  order: number;
  name: string;
  planName?: string | null;
  addedAt: string;
  completedAt?: string | null;
  status: 'erledigt' | 'offen';
}

/** Liest den im Protokoll gespeicherten Verlauf robust ein (leer bei fehlenden/ungültigen Daten). */
export function parseInstructionHistory(raw?: string | null): InstructionHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InstructionHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

interface MobileProgress {
  currentUid?: string | null;
  completed?: { uid: string; completedAt?: string }[];
}

@Injectable({ providedIn: 'root' })
export class InstructionFlowService {
  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);

  /** Erledigte (eingefrorene) Schritte in Abschluss-Reihenfolge */
  readonly completedSteps = signal<FlowStep[]>([]);
  /** Offene Schritte in der Reihenfolge, in der der Ersthelfer sie abarbeitet */
  readonly pendingSteps = signal<FlowStep[]>([]);
  /** Schritt, der laut Mobile App gerade angezeigt wird */
  readonly currentUid = signal<string | null>(null);
  /** true, sobald der aktuelle Stand an das Handy übertragen wurde */
  readonly synced = signal<boolean>(false);

  readonly currentStep = computed(() => {
    const pending = this.pendingSteps();
    const uid = this.currentUid();
    return pending.find((s) => s.uid === uid) ?? pending[0] ?? null;
  });
  readonly totalSteps = computed(() => this.completedSteps().length + this.pendingSteps().length);
  readonly hasSteps = computed(() => this.totalSteps() > 0);

  constructor() {
    this.signaling.on('instruction-progress', (payload: any) => {
      if (!this.isFromActiveCall(payload)) return;
      this.applyProgress(payload.progress as MobileProgress);
    });

    // Handy hat (neu) verbunden und fragt nach dem aktuellen Stand
    this.signaling.on('instruction-sync-request', (payload: any) => {
      if (!this.isFromActiveCall(payload)) return;
      this.sync();
    });
  }

  get canReachMobile(): boolean {
    return this.signaling.isConnected && !!this.callContext.getActiveCallId();
  }

  // ── Hinzufügen ───────────────────────────────────────────────────────
  addMeasure(measure: Measure, index?: number): void {
    this.insert([this.createStep(measure)], index);
  }

  addPlan(plan: Plan, index?: number): void {
    const planInstanceId = this.newUid('planrun');
    const steps = (plan.measures ?? []).map((m) =>
      this.createStep(m, {
        planId: plan.id,
        planName: plan.name,
        planInstanceId,
        fallbackTags: plan.tags,
      }),
    );
    this.insert(steps, index);
  }

  // ── Bearbeiten offener Schritte (erledigte bleiben unangetastet) ─────
  removePending(uid: string): void {
    this.pendingSteps.update((list) => list.filter((s) => s.uid !== uid));
    this.sync();
  }

  removePlanInstance(planInstanceId: string): void {
    this.pendingSteps.update((list) => list.filter((s) => s.planInstanceId !== planInstanceId));
    this.sync();
  }

  movePending(previousIndex: number, currentIndex: number): void {
    if (previousIndex === currentIndex) return;
    this.pendingSteps.update((list) => {
      const next = [...list];
      const [moved] = next.splice(previousIndex, 1);
      if (!moved) return list;
      next.splice(Math.max(0, Math.min(currentIndex, next.length)), 0, moved);
      return next;
    });
    this.sync();
  }

  clearPending(): void {
    this.pendingSteps.set([]);
    this.sync();
  }

  /** Disponent schaltet den aktuellen Schritt am Handy weiter (gleiches Verhalten wie „Weiter“ am Handy). */
  requestAdvance(): void {
    const targetId = this.callContext.getActiveCallId();
    if (!targetId || !this.signaling.isConnected) return;
    this.signaling.emit('instruction-next', { from: 'controlcenter', to: targetId });
  }

  // ── Synchronisation ──────────────────────────────────────────────────
  /** Überträgt die offenen Schritte (in Reihenfolge) an die Mobile App. */
  sync(): void {
    const targetId = this.callContext.getActiveCallId();
    if (!targetId || !this.signaling.isConnected) {
      this.synced.set(false);
      return;
    }

    this.signaling.emit('instruction-queue', {
      from: 'controlcenter',
      to: targetId,
      items: this.pendingSteps().map((s) => ({
        uid: s.uid,
        id: s.measureId,
        name: s.name,
        description: s.description,
        imageUrl: s.imageUrl,
        planName: s.planName,
        tags: s.tags,
      })),
    });
    this.synced.set(true);
  }

  private applyProgress(progress?: MobileProgress): void {
    if (!progress) return;

    const completions = new Map<string, string>();
    for (const c of progress.completed ?? []) {
      if (c?.uid) completions.set(c.uid, c.completedAt || new Date().toISOString());
    }

    const newlyCompleted = this.pendingSteps()
      .filter((s) => completions.has(s.uid))
      .map((s) => ({ ...s, completedAt: completions.get(s.uid)! }))
      .sort((a, b) => a.completedAt.localeCompare(b.completedAt));

    if (newlyCompleted.length > 0) {
      const doneUids = new Set(newlyCompleted.map((s) => s.uid));
      this.pendingSteps.update((list) => list.filter((s) => !doneUids.has(s.uid)));
      this.completedSteps.update((list) => [...list, ...newlyCompleted]);
    }

    this.currentUid.set(progress.currentUid ?? null);
  }

  // ── Protokoll ────────────────────────────────────────────────────────
  buildHistory(): InstructionHistoryEntry[] {
    const completed = this.completedSteps().map((s) => ({ step: s, status: 'erledigt' as const }));
    const pending = this.pendingSteps().map((s) => ({ step: s, status: 'offen' as const }));

    return [...completed, ...pending].map(({ step, status }, i) => ({
      order: i + 1,
      name: step.name,
      planName: step.planName ?? null,
      addedAt: step.addedAt,
      completedAt: step.completedAt ?? null,
      status,
    }));
  }

  /** Setzt den Ablauf für einen neuen Einsatz zurück. */
  reset(): void {
    this.completedSteps.set([]);
    this.pendingSteps.set([]);
    this.currentUid.set(null);
    this.synced.set(false);
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  private insert(steps: FlowStep[], index?: number): void {
    if (steps.length === 0) return;
    this.pendingSteps.update((list) => {
      const next = [...list];
      const at = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
      next.splice(at, 0, ...steps);
      return next;
    });
    this.sync();
  }

  private createStep(
    measure: Measure,
    plan?: { planId: number; planName: string; planInstanceId: string; fallbackTags?: string[] },
  ): FlowStep {
    return {
      uid: this.newUid('step'),
      measureId: measure.id,
      name: measure.name,
      description: measure.description ?? '',
      imageUrl: measure.imageUrl,
      tags: measure.tags?.length ? [...measure.tags] : [...(plan?.fallbackTags ?? [])],
      measure,
      planId: plan?.planId,
      planName: plan?.planName,
      planInstanceId: plan?.planInstanceId,
      addedAt: new Date().toISOString(),
    };
  }

  private newUid(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private isFromActiveCall(payload: any): boolean {
    const activeId = this.callContext.getActiveCallId();
    return !!activeId && payload?.from === activeId;
  }
}
