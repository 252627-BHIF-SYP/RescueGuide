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
  ) {}

  fetchInitialData(): void {
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

  createMeasure(name: string, description: string, imageUrl?: string): Observable<Measure> {
    const payload = {
      name,
      description,
      isUserCreated: true,
      imageUrl,
      author: this.auth.userName() || 'Unbekannt'
    };

    return this.http.post<Measure>(`${environment.apiUrl}/Measures`, payload).pipe(
      tap(newMeasure => {
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next([...current, newMeasure]);
      })
    );
  }

  rollbackMeasure(measureId: number): void {
    this.http.delete(`${environment.apiUrl}/Measures/${measureId}`).subscribe({
      next: () => {
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next(current.filter(m => m.id !== measureId));
      },
      error: (err) => console.error('Failed to rollback measure', err)
    });
  }

  editMeasure(measure: Measure, name: string, description: string, imageUrl?: string): Observable<any> {
    const payload = {
      ...measure,
      name,
      description,
      imageUrl
    };

    return this.http.put(`${environment.apiUrl}/Measures/${measure.id}`, payload).pipe(
      tap(() => {
        const current = this._availableMeasures$.getValue();
        const updated = current.map(m => m.id === measure.id ? { ...m, name, description, imageUrl } : m);
        this._availableMeasures$.next(updated);

        const currentActive = this._currentMeasures$.getValue();
        const updatedActive = currentActive.map(m => m.id === measure.id ? { ...m, name, description, imageUrl } : m);
        this._currentMeasures$.next(updatedActive);
      })
    );
  }

  deleteMeasure(measure: Measure): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/Measures/${measure.id}`).pipe(
      tap(() => {
        const current = this._availableMeasures$.getValue();
        this._availableMeasures$.next(current.filter(m => m.id !== measure.id));

        const active = this._currentMeasures$.getValue();
        this._currentMeasures$.next(active.filter(m => m.id !== measure.id));
      })
    );
  }

  createPlan(name: string, selectedMeasures: Measure[]): Observable<Plan> {
    const payload = {
      name,
      measures: selectedMeasures,
      author: this.auth.userName() || 'Unbekannt'
    };

    return this.http.post<Plan>(`${environment.apiUrl}/Plans`, payload).pipe(
      tap(newPlan => {
        const current = this._plans$.getValue();
        this._plans$.next([...current, newPlan]);
      })
    );
  }

  editPlan(plan: Plan, name: string, measures: Measure[]): Observable<any> {
    const payload = {
      ...plan,
      name,
      measures
    };

    return this.http.put(`${environment.apiUrl}/Plans/${plan.id}`, payload).pipe(
      tap(() => {
        const current = this._plans$.getValue();
        const updated = current.map(p => p.id === plan.id ? { ...p, name, measures } : p);
        this._plans$.next(updated);
      })
    );
  }

  deletePlan(plan: Plan): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/Plans/${plan.id}`).pipe(
      tap(() => {
        const current = this._plans$.getValue();
        this._plans$.next(current.filter(p => p.id !== plan.id));
      })
    );
  }
}
