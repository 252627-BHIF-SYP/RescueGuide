import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface Measure {
  id: number;
  name: string;
  description: string;
  isUserCreated?: boolean;
  createdAt?: Date;
  author?: string;
  imageUrl?: string;
  tags?: string[];
}

export interface Plan {
  id: number;
  name: string;
  measures: Measure[];
  createdAt?: Date;
  author?: string;
  tags?: string[];
}

const MEASURE_TAGS_KEY = 'rg_measure_tags';
const PLAN_TAGS_KEY = 'rg_plan_tags';

@Injectable({
  providedIn: 'root'
})
export class InstructionMenuService {
  private readonly _availableMeasures$ = new BehaviorSubject<Measure[]>([]);
  private readonly _plans$ = new BehaviorSubject<Plan[]>([]);
  private readonly _currentMeasures$ = new BehaviorSubject<Measure[]>([]);

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {}

  fetchInitialData(): void {
    const storedMeasureTags = this.getStoredTags(MEASURE_TAGS_KEY);
    const storedPlanTags = this.getStoredTags(PLAN_TAGS_KEY);

    this.http.get<Measure[]>(`${environment.apiUrl}/Measures`).subscribe({
      next: (measures) => {
        const enriched = (measures || []).map(m => {
          const tags = (m.tags && m.tags.length > 0)
            ? m.tags
            : (storedMeasureTags[m.id] || this.deriveDefaultTags(m.name, m.description));
          return { ...m, tags };
        });
        this._availableMeasures$.next(enriched);
      },
      error: (err) => {
        console.error('Failed to load measures', err);
        // Fallback for offline / dev preview if backend unreachable
        if (this._availableMeasures$.getValue().length === 0) {
          this._availableMeasures$.next(this.getMockMeasures());
        }
      }
    });

    this.http.get<Plan[]>(`${environment.apiUrl}/Plans`).subscribe({
      next: (plans) => {
        const enriched = (plans || []).map(p => {
          const tags = (p.tags && p.tags.length > 0)
            ? p.tags
            : (storedPlanTags[p.id] || this.deriveDefaultTags(p.name, ''));
          return { ...p, tags };
        });
        this._plans$.next(enriched);
      },
      error: (err) => {
        console.error('Failed to load plans', err);
        // Fallback for offline / dev preview if backend unreachable
        if (this._plans$.getValue().length === 0) {
          this._plans$.next(this.getMockPlans());
        }
      }
    });
  }

  get availableMeasures$(): Observable<Measure[]> {
    return this._availableMeasures$.asObservable();
  }

  get plans$(): Observable<Plan[]> {
    return this._plans$.asObservable();
  }

  get currentMeasures$(): Observable<Measure[]> {
    return this._currentMeasures$.asObservable();
  }

  get availableMeasures(): Measure[] {
    return this._availableMeasures$.getValue();
  }

  get plans(): Plan[] {
    return this._plans$.getValue();
  }

  get currentMeasures(): Measure[] {
    return this._currentMeasures$.getValue();
  }

  addMeasure(measure: Measure): void {
    const current = this._currentMeasures$.getValue();
    if (!current.find(m => m.id === measure.id)) {
      this._currentMeasures$.next([...current, measure]);
    }
  }

  removeMeasure(measure: Measure): void {
    const current = this._currentMeasures$.getValue();
    const updated = current.filter(m => m.id !== measure.id);
    this._currentMeasures$.next(updated);
  }

  createMeasure(name: string, description: string, imageUrl?: string, tags: string[] = []): Observable<Measure> {
    const normalizedTags = this.normalizeTags(tags);
    const payload = {
      name,
      description,
      isUserCreated: true,
      imageUrl,
      tags: normalizedTags,
      author: this.auth.userName() || 'Unbekannt'
    };

    return this.http.post<Measure>(`${environment.apiUrl}/Measures`, payload).pipe(
      tap(newMeasure => {
        const measureWithTags: Measure = {
          ...newMeasure,
          tags: (newMeasure.tags && newMeasure.tags.length > 0) ? newMeasure.tags : normalizedTags
        };
        this.saveTagForItem(MEASURE_TAGS_KEY, measureWithTags.id, measureWithTags.tags || []);
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next([...current, measureWithTags]);
      })
    );
  }

  rollbackMeasure(measureId: number): void {
    this.removeTagForItem(MEASURE_TAGS_KEY, measureId);
    this.http.delete(`${environment.apiUrl}/Measures/${measureId}`).subscribe({
      next: () => {
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next(current.filter(m => m.id !== measureId));
      },
      error: (err) => console.error('Failed to rollback measure', err)
    });
  }

  editMeasure(measure: Measure, name: string, description: string, imageUrl?: string, tags?: string[]): Observable<any> {
    const normalizedTags = tags ? this.normalizeTags(tags) : (measure.tags || []);
    const payload = {
      ...measure,
      name,
      description,
      imageUrl,
      tags: normalizedTags
    };

    return this.http.put(`${environment.apiUrl}/Measures/${measure.id}`, payload).pipe(
      tap(() => {
        this.saveTagForItem(MEASURE_TAGS_KEY, measure.id, normalizedTags);

        const current = this._availableMeasures$.getValue();
        const updated = current.map(m => m.id === measure.id ? { ...m, name, description, imageUrl, tags: normalizedTags } : m);
        this._availableMeasures$.next(updated);

        const currentActive = this._currentMeasures$.getValue();
        const updatedActive = currentActive.map(m => m.id === measure.id ? { ...m, name, description, imageUrl, tags: normalizedTags } : m);
        this._currentMeasures$.next(updatedActive);
      })
    );
  }

  deleteMeasure(measure: Measure): Observable<any> {
    this.removeTagForItem(MEASURE_TAGS_KEY, measure.id);
    return this.http.delete(`${environment.apiUrl}/Measures/${measure.id}`).pipe(
      tap(() => {
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next(current.filter(m => m.id !== measure.id));

        const active = this._currentMeasures$.getValue();
        this._currentMeasures$.next(active.filter(m => m.id !== measure.id));
      })
    );
  }

  createPlan(name: string, selectedMeasures: Measure[], tags: string[] = []): Observable<Plan> {
    const normalizedTags = this.normalizeTags(tags);
    const payload = {
      name,
      measures: selectedMeasures,
      tags: normalizedTags,
      author: this.auth.userName() || 'Unbekannt'
    };

    return this.http.post<Plan>(`${environment.apiUrl}/Plans`, payload).pipe(
      tap(newPlan => {
        const planWithTags: Plan = {
          ...newPlan,
          tags: (newPlan.tags && newPlan.tags.length > 0) ? newPlan.tags : normalizedTags
        };
        this.saveTagForItem(PLAN_TAGS_KEY, planWithTags.id, planWithTags.tags || []);
        const current = this._plans$.getValue();
        this._plans$.next([...current, planWithTags]);
      })
    );
  }

  editPlan(plan: Plan, name: string, measures: Measure[], tags?: string[]): Observable<any> {
    const normalizedTags = tags ? this.normalizeTags(tags) : (plan.tags || []);
    const payload = {
      ...plan,
      name,
      measures,
      tags: normalizedTags
    };

    return this.http.put(`${environment.apiUrl}/Plans/${plan.id}`, payload).pipe(
      tap(() => {
        this.saveTagForItem(PLAN_TAGS_KEY, plan.id, normalizedTags);

        const current = this._plans$.getValue();
        const updated = current.map(p => p.id === plan.id ? { ...p, name, measures, tags: normalizedTags } : p);
        this._plans$.next(updated);
      })
    );
  }

  deletePlan(plan: Plan): Observable<any> {
    this.removeTagForItem(PLAN_TAGS_KEY, plan.id);
    return this.http.delete(`${environment.apiUrl}/Plans/${plan.id}`).pipe(
      tap(() => {
        const current = this._plans$.getValue();
        this._plans$.next(current.filter(p => p.id !== plan.id));
      })
    );
  }

  // ── Helper methods for Tag Persistence & Suggestion ──────────────────
  private getStoredTags(key: string): Record<number, string[]> {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveTagForItem(key: string, id: number, tags: string[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const map = this.getStoredTags(key);
      map[id] = tags;
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to save tags to localStorage', e);
    }
  }

  private removeTagForItem(key: string, id: number): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const map = this.getStoredTags(key);
      delete map[id];
      localStorage.setItem(key, JSON.stringify(map));
    } catch (e) {
      console.warn('Failed to remove tag from localStorage', e);
    }
  }

  toTitleCase(tag: string): string {
    const trimmed = (tag || '').trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  normalizeTags(tags: string[]): string[] {
    if (!tags) return [];
    const clean = tags
      .map(t => this.toTitleCase(t))
      .filter(t => t.length > 0 && t.length <= 50 && /^\p{L}+$/u.test(t));
    return Array.from(new Set(clean));
  }

  getAllKnownTags(): string[] {
    const set = new Set<string>([
      'Atmung',
      'Reanimation',
      'Trauma',
      'Blutung',
      'Kinder',
      'Kreislauf',
      'Neurologie',
      'Allgemein'
    ]);

    for (const p of this._plans$.getValue()) {
      if (p.tags) {
        for (const t of p.tags) {
          if (t) set.add(this.toTitleCase(t));
        }
      }
    }

    for (const m of this._availableMeasures$.getValue()) {
      if (m.tags) {
        for (const t of m.tags) {
          if (t) set.add(this.toTitleCase(t));
        }
      }
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
  }

  private deriveDefaultTags(name: string, description: string): string[] {
    const text = `${name} ${description}`.toLowerCase();
    const tags: string[] = [];

    if (text.includes('reanimation') || text.includes('cpr') || text.includes('herzdruck') || text.includes('aed') || text.includes('defibrillator')) {
      tags.push('Reanimation');
    }
    if (text.includes('atmung') || text.includes('beatmung') || text.includes('stabile seitenlage') || text.includes('atemweg') || text.includes('hyperventilation')) {
      tags.push('Atmung');
    }
    if (text.includes('blutung') || text.includes('druckverband') || text.includes('wunde') || text.includes('tourniquet') || text.includes('verband')) {
      tags.push('Blutung');
    }
    if (text.includes('trauma') || text.includes('bruch') || text.includes('fraktur') || text.includes('sturz') || text.includes('unfall') || text.includes('verbrennung')) {
      tags.push('Trauma');
    }
    if (text.includes('kind') || text.includes('säugling') || text.includes('baby') || text.includes('pädiatrie')) {
      tags.push('Kinder');
    }
    if (text.includes('kreislauf') || text.includes('schock') || text.includes('kollaps') || text.includes('bewusstlos')) {
      tags.push('Kreislauf');
    }
    if (text.includes('ersticken') || text.includes('heimlich') || text.includes('fremdkörper')) {
      tags.push('Atmung', 'Notfall');
    }

    if (tags.length === 0) {
      tags.push('Allgemein');
    }

    return Array.from(new Set(tags));
  }

  // Built-in starter fallback data for development/demo
  private getMockMeasures(): Measure[] {
    return [
      {
        id: 1,
        name: 'Herzdruckmassage (Erwachsene)',
        description: '30-mal kräftig und schnell in der Mitte des Brustkorbs drücken (Frequenz 100-120/min, mind. 5-6 cm Tiefe).',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Reanimation', 'Kreislauf']
      },
      {
        id: 2,
        name: 'Mund-zu-Mund Beatmung',
        description: 'Kopf überstrecken, Nase zuhalten, 2-mal gleichmäßig beatmen bis sich der Brustkorb hebt.',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Atmung', 'Reanimation']
      },
      {
        id: 3,
        name: 'Stabile Seitenlage',
        description: 'Arm anwinkeln, gegenseitiges Knie aufstellen, Person vorsichtig zu sich herüberrollen. Kopf überstrecken, Mund leicht öffnen.',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Atmung', 'Kreislauf']
      },
      {
        id: 4,
        name: 'Druckverband anlegen',
        description: 'Wundauflage auflegen, mit Binde fixieren, Druckpolster mittig aufsetzen und stramm umwickeln.',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Blutung', 'Trauma']
      },
      {
        id: 5,
        name: 'Defibrillator (AED) einsetzen',
        description: 'Gerät einschalten, Sprachanweisungen folgen, Elektroden wie abgebildet aufkleben. Patienten nicht berühren während Analyse.',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Reanimation', 'Kreislauf']
      },
      {
        id: 6,
        name: 'Rückenklopfschläge bei Erstickungsanfall',
        description: 'Oberkörper leicht nach vorne beugen, bis zu 5 kräftige Schläge zwischen die Schulterblätter mit dem Handballen ausführen.',
        isUserCreated: false,
        author: 'Leitstelle',
        tags: ['Atmung']
      }
    ];
  }

  private getMockPlans(): Plan[] {
    const measures = this.getMockMeasures();
    return [
      {
        id: 1,
        name: 'Reanimation Erwachsene (Basic Life Support)',
        author: 'Leitstelle',
        tags: ['Reanimation', 'Kreislauf'],
        measures: [measures[0], measures[4], measures[1]]
      },
      {
        id: 2,
        name: 'Starke arterielle Blutung',
        author: 'Leitstelle',
        tags: ['Blutung', 'Trauma'],
        measures: [measures[3]]
      },
      {
        id: 3,
        name: 'Bewusstlose Person mit normaler Atmung',
        author: 'Leitstelle',
        tags: ['Atmung', 'Kreislauf'],
        measures: [measures[2]]
      },
      {
        id: 4,
        name: 'Akute Fremdkörperaspiration (Ersticken)',
        author: 'Leitstelle',
        tags: ['Atmung'],
        measures: [measures[5]]
      }
    ];
  }
}
