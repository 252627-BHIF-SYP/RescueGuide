import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Location`;

  getLocations(): Observable<Notruf[]> {
    console.log('Using API URL:', this.apiUrl);
    return this.http.get<Notruf[]>(`${this.apiUrl}`);
  }
}