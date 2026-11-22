import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardEmergency {
  id: number;
  status: 'Active' | 'Completed';
  startedAt: string;
  endedAt: string | null;
  emergencyType: string | null;
  handlerName: string | null;
  address: string | null;
  protocolId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getEmergencies(): Observable<DashboardEmergency[]> {
    return this.http.get<DashboardEmergency[]>(`${environment.apiUrl}/Emergency/dashboard`);
  }

  /** Löscht den Einsatz inkl. Einsatzprotokoll (Cascade im Backend). */
  deleteEmergency(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/Emergency/${id}`);
  }
}
