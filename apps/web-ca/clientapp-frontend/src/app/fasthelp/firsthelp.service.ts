import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FirstHelp {
  id: number;
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class FirstHelpService {
  private apiUrl = environment.apiUrl + '/FirstHelp';

  constructor(private http: HttpClient) {}

  getAll(): Observable<FirstHelp[]> {
    return this.http.get<FirstHelp[]>(this.apiUrl);
  }
}
