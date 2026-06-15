import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private readonly _availableMeasures$ = new BehaviorSubject<Measure[]>([]);
  private readonly _plans$ = new BehaviorSubject<Plan[]>([]);
  private readonly _currentMeasures$ = new BehaviorSubject<Measure[]>([]);

  constructor(
    private auth: AuthService,
    private http: HttpClient
  ) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.http.get<Measure[]>(`${environment.apiUrl}/Measures`).subscribe({
      next: (measures) => this._availableMeasures$.next(measures),
      error: (err) => console.error('Failed to load measures', err)
    });

    this.http.get<Plan[]>(`${environment.apiUrl}/Plans`).subscribe({
      next: (plans) => this._plans$.next(plans),
      error: (err) => console.error('Failed to load plans', err)
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

  createMeasure(name: string, description: string, imageUrl?: string): Measure {
    const newMeasure: Partial<Measure> = {
      name,
      description,
      isUserCreated: true,
      author: this.auth.userName() || 'Unbekannt',
      imageUrl
    };

    // We can return a temporary measure object, but ideally we await backend response
    // For simplicity with the current synchronous signature, we emit an optimistic update
    const tempId = Date.now();
    const optimisticMeasure = { ...newMeasure, id: tempId } as Measure;
    
    this.http.post<Measure>(`${environment.apiUrl}/Measures`, newMeasure).subscribe({
      next: (createdMeasure) => {
        // Reload all or update local
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to create measure', err)
    });

    return optimisticMeasure;
  }

  rollbackMeasure(measureId: number): void {
    const current = this._availableMeasures$.getValue();
    this._availableMeasures$.next(current.filter(m => m.id !== measureId));
  }

  editMeasure(measure: Measure, name: string, description: string, imageUrl?: string): void {
    const updatedMeasure = { ...measure, name, description, imageUrl };
    
    this.http.put(`${environment.apiUrl}/Measures/${measure.id}`, updatedMeasure).subscribe({
      next: () => {
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to edit measure', err)
    });
  }

  deleteMeasure(measure: Measure): void {
    this.http.delete(`${environment.apiUrl}/Measures/${measure.id}`).subscribe({
      next: () => {
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to delete measure', err)
    });
  }

  createPlan(name: string, selectedMeasures: Measure[]): Plan {
    const newPlan: Partial<Plan> = {
      name,
      measures: selectedMeasures,
      author: this.auth.userName() || 'Unbekannt'
    };

    const tempId = Date.now();
    const optimisticPlan = { ...newPlan, id: tempId } as Plan;

    this.http.post<Plan>(`${environment.apiUrl}/Plans`, newPlan).subscribe({
      next: () => {
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to create plan', err)
    });

    return optimisticPlan;
  }

  editPlan(plan: Plan, name: string, measures: Measure[]): void {
    const updatedPlan = { ...plan, name, measures };

    this.http.put(`${environment.apiUrl}/Plans/${plan.id}`, updatedPlan).subscribe({
      next: () => {
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to edit plan', err)
    });
  }

  deletePlan(plan: Plan): void {
    this.http.delete(`${environment.apiUrl}/Plans/${plan.id}`).subscribe({
      next: () => {
        this.loadInitialData();
      },
      error: (err) => console.error('Failed to delete plan', err)
    });
  }
}
