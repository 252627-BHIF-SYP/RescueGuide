import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Notruf {
  userId: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/leitstelle`;

  /** Holt alle Standortdaten vom Control-Center Backend */
  getLocations(): Observable<Notruf[]> {
    console.log('Using API URL:', this.apiUrl);
    return this.http.get<Notruf[]>(`${this.apiUrl}/all`);
  }

  /** Wandelt Koordinaten in eine lesbare Adresse um (OpenStreetMap) */
  getAddressFromCoords(lat: number, lon: number): Observable<any> {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    return this.http.get(url);
  }

  sendLocation(payload: any): Observable<any> {
  // Nutzt die URL aus der environment.prod.ts (http://192.168.6.10:5062/api/leitstelle/receive)
  return this.http.post(`${this.apiUrl}/receive`, payload);
}
}