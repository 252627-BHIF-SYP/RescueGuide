import {Injectable, signal} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'user_name';
  private readonly AVAILABILITY_KEY = 'user_available';

  // Signal mit Namen - prüft bei Start LocalStorage
  userName = signal<string | null>(localStorage.getItem(this.STORAGE_KEY));

  // Signal für Verfügbarkeit - standardmäßig verfügbar wenn eingeloggt
  available = signal<boolean>(localStorage.getItem(this.AVAILABILITY_KEY) !== 'false' && this.isLoggedIn());

  login(name: string) {
    localStorage.setItem(this.STORAGE_KEY, name);
    this.userName.set(name);
    // Bei Login automatisch verfügbar setzen
    this.setAvailable(true);
  }

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.userName.set(null);
    // Bei Logout Verfügbarkeit zurücksetzen
    this.setAvailable(false);
  }

  toggleAvailability() {
    this.setAvailable(!this.available());
  }

  private setAvailable(isAvailable: boolean) {
    localStorage.setItem(this.AVAILABILITY_KEY, isAvailable.toString());
    this.available.set(isAvailable);
  }

  toggleLogin(defaultName = 'Leitstelle') {
    if (this.isLoggedIn()) {
      this.logout();
    } else {
      this.login(defaultName);
    }
  }

  isLoggedIn(): boolean {
    return this.userName() !== null;
  }
}
