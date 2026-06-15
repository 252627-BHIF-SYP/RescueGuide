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
  callerName: string | null;
  address: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getEmergencies(): Observable<DashboardEmergency[]> {
    return this.http.get<DashboardEmergency[]>(`${environment.apiUrl}/Emergency/dashboard`);
  }
}
