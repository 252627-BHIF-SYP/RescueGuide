import { Injectable } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Measure {
  id: number;
  name: string;
  description: string;
  isUserCreated?: boolean;
  createdAt?: Date;
  author?: string;
  imageUrl?: string;
}

export interface Plan {
  id: number;
  name: string;
  measures: Measure[];
  createdAt?: Date;
  author?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstructionMenuService {
  private readonly _availableMeasures$ = new BehaviorSubject<Measure[]>([
    { id: 1, name: 'Erste Hilfe leisten', description: 'Grundlegende Erste Hilfe Maßnahmen', isUserCreated: false },
    { id: 2, name: 'Feuer löschen', description: 'Feuer mit geeigneten Mitteln löschen', isUserCreated: false },
    { id: 3, name: 'Rettung rufen', description: 'Notruf absetzen', isUserCreated: false }
  ]);

  private readonly _plans$ = new BehaviorSubject<Plan[]>([]);
  private readonly _currentMeasures$ = new BehaviorSubject<Measure[]>([]);

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {}

  // Observables for components to subscribe to
  get availableMeasures$(): Observable<Measure[]> {
    return this._availableMeasures$.asObservable();
  }

  get plans$(): Observable<Plan[]> {
    return this._plans$.asObservable();
  }

  get currentMeasures$(): Observable<Measure[]> {
    return this._currentMeasures$.asObservable();
  }

  // Synchronous getters for immediate access (compatibility)
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

  createMeasure(name: string, description: string, imageUrl?: string): Measure {
    const current = this._availableMeasures$.getValue();
    const newMeasure: Measure = {
      id: current.length > 0 ? Math.max(...current.map(m => m.id)) + 1 : 1,
      name,
      description,
      isUserCreated: true,
      createdAt: new Date(),
      author: this.auth.userName() || 'Unbekannt',
      imageUrl
    };
    this._availableMeasures$.next([...current, newMeasure]);
    return newMeasure;
  }

  editMeasure(measure: Measure, name: string, description: string, imageUrl?: string): void {
    const current = this._availableMeasures$.getValue();
    const updated = current.map(m => {
      if (m.id === measure.id) {
        return { ...m, name, description, imageUrl };
      }
      return m;
    });
    this._availableMeasures$.next(updated);

    // Update in currentMeasures as well
    const currentActive = this._currentMeasures$.getValue();
    const updatedActive = currentActive.map(m => {
      if (m.id === measure.id) {
        return { ...m, name, description, imageUrl };
      }
      return m;
    });
    this._currentMeasures$.next(updatedActive);
  }

  deleteMeasure(measure: Measure): void {
    const current = this._availableMeasures$.getValue();
    this._availableMeasures$.next(current.filter(m => m.id !== measure.id));
    
    const active = this._currentMeasures$.getValue();
    this._currentMeasures$.next(active.filter(m => m.id !== measure.id));
  }

  createPlan(name: string, selectedMeasures: Measure[]): Plan {
    const current = this._plans$.getValue();
    const newPlan: Plan = {
      id: current.length > 0 ? Math.max(...current.map(p => p.id)) + 1 : 1,
      name,
      measures: selectedMeasures,
      createdAt: new Date(),
      author: this.auth.userName() || 'Unbekannt'
    };
    this._plans$.next([...current, newPlan]);
    return newPlan;
  }

  editPlan(plan: Plan, name: string, measures: Measure[]): void {
    const current = this._plans$.getValue();
    const updated = current.map(p => {
      if (p.id === plan.id) {
        return { ...p, name, measures };
      }
      return p;
    });
    this._plans$.next(updated);
  }

  deletePlan(plan: Plan): void {
    const current = this._plans$.getValue();
    this._plans$.next(current.filter(p => p.id !== plan.id));
  }
}
