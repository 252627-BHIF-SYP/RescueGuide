import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private apiUrl = 'http://localhost:5273/api/user/send-location';

  constructor(private http: HttpClient) {}

  sendToBackend(lat: number, lng: number) {
    const body = {
      userId: 'Ersthelfer_Mobil',
      latitude: lat,
      longitude: lng,
      timestamp: new Date().toISOString()
    };
    return this.http.post(this.apiUrl, body);
  }
}
