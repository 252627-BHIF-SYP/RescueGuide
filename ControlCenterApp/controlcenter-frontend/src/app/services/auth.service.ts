import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'user_name';
  private apiUrl = environment.apiUrl + '/auth'; 

  userName = signal<string | null>(localStorage.getItem(this.STORAGE_KEY));

  constructor(private http: HttpClient, private router: Router) {}

  login(name: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { name, password }).pipe(
      tap((res: any) => {
        localStorage.setItem('token', res.token);
        // Username aus JWT extrahieren
        const payload = JSON.parse(atob(res.token.split('.')[1]));
        const username = payload['unique_name'] || payload['name'] || name;
        localStorage.setItem(this.STORAGE_KEY, username);
        this.userName.set(username);
      })
    );
  }

  register(name: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, password });
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem(this.STORAGE_KEY);
    this.userName.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}
