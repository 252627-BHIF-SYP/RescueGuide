import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'user_name';

  // Signal mit Namen - prüft bei Start LocalStorage
  userName = signal<string | null>(localStorage.getItem(this.STORAGE_KEY));

  login(name: string) {
    localStorage.setItem(this.STORAGE_KEY, name);
    this.userName.set(name);
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.userName.set(null);
  }

  isLoggedIn(): boolean {
    return this.userName() !== null;
  }
}
