import { Injectable } from '@angular/core';

export interface Measure {
  id: number;
  name: string;
  description: string;
  isUserCreated?: boolean;
}

export interface Plan {
  id: number;
  name: string;
  measures: Measure[];
}

@Injectable({
  providedIn: 'root'
})
export class InstructionMenuService {
  private _availableMeasures: Measure[] = [
    { id: 1, name: 'Erste Hilfe leisten', description: 'Grundlegende Erste Hilfe Maßnahmen', isUserCreated: false },
    { id: 2, name: 'Feuer löschen', description: 'Feuer mit geeigneten Mitteln löschen', isUserCreated: false },
    { id: 3, name: 'Rettung rufen', description: 'Notruf absetzen', isUserCreated: false }
  ];

  private _plans: Plan[] = [];

  private _currentMeasures: Measure[] = [];

  get availableMeasures(): Measure[] {
    return this._availableMeasures;
  }

  get plans(): Plan[] {
    return this._plans;
  }

  get currentMeasures(): Measure[] {
    return this._currentMeasures;
  }

  addMeasure(measure: Measure): void {
    if (!this._currentMeasures.find(m => m.id === measure.id)) {
      this._currentMeasures.push(measure);
    }
  }

  removeMeasure(measure: Measure): void {
    const index = this._currentMeasures.indexOf(measure);
    if (index > -1) {
      this._currentMeasures.splice(index, 1);
    }
  }

  createMeasure(name: string, description: string): Measure {
    const newMeasure: Measure = {
      id: this._availableMeasures.length + 1,
      name,
      description,
      isUserCreated: true
    };
    this._availableMeasures.push(newMeasure);
    return newMeasure;
  }

  editMeasure(measure: Measure, name: string, description: string): void {
    measure.name = name;
    measure.description = description;
  }

  deleteMeasure(measure: Measure): void {
    const index = this._availableMeasures.indexOf(measure);
    if (index > -1) {
      this._availableMeasures.splice(index, 1);
    }
    // Also remove from currentMeasures if present
    const currentIndex = this._currentMeasures.indexOf(measure);
    if (currentIndex > -1) {
      this._currentMeasures.splice(currentIndex, 1);
    }
  }

  createPlan(name: string, selectedMeasures: Measure[]): Plan {
    const newPlan: Plan = {
      id: this._plans.length + 1,
      name,
      measures: selectedMeasures
    };
    this._plans.push(newPlan);
    return newPlan;
  }

  editPlan(plan: Plan, name: string, measures: Measure[]): void {
    plan.name = name;
    plan.measures = measures;
  }

  deletePlan(plan: Plan): void {
    const index = this._plans.indexOf(plan);
    if (index > -1) {
      this._plans.splice(index, 1);
    }
  }
}