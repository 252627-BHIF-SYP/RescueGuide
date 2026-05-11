import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

export interface Patient {
  username: string;
  password: string;
  geburtsdatum: string;
  anschrift: string;
  allergien: string;
  vorerkrankungen: string;
  medikamente: string;
  blutgruppe: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private router = inject(Router);

  isRegisterMode = signal(false);
  error = signal('');

  username = '';
  password = '';

  geburtsdatum = '';
  anschrift = '';
  allergien = '';
  vorerkrankungen = '';
  medikamente = '';
  blutgruppe = '';

  toggleMode() {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.error.set('');
    this.resetFields();
  }

  resetFields() {
    this.username = '';
    this.password = '';
  }

  onLogin() {
    const rawData = localStorage.getItem('rescue_users');
    const users = rawData ? JSON.parse(rawData) : [];

    const foundUser = users.find((u: any) =>
      u.username === this.username && u.password === this.password
    );

    if (foundUser) {
      // Wir merken uns den aktuell eingeloggten User im LocalStorage
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      this.router.navigate(['/emergency-page']);
    } else {
      this.error.set('Name oder Passwort falsch.');
    }
  }

  onRegister() {
    // Einfache Validierung
    if (!this.username || !this.password) {
      this.error.set('Bitte Name und Passwort vergeben.');
      return;
    }

    const newUser = {
      username: this.username,
      password: this.password,
      geburtsdatum: this.geburtsdatum,
      anschrift: this.anschrift,
      allergien: this.allergien,
      vorerkrankungen: this.vorerkrankungen,
      medikamente: this.medikamente,
      blutgruppe: this.blutgruppe
    };

    // Bestehende User laden und neuen hinzufügen
    const rawData = localStorage.getItem('rescue_users');
    const users = rawData ? JSON.parse(rawData) : [];

    // Prüfen, ob Name schon existiert
    if (users.find((u: any) => u.username === this.username)) {
      this.error.set('Dieser Name ist bereits registriert.');
      return;
    }

    users.push(newUser);
    localStorage.setItem('rescue_users', JSON.stringify(users));

    // Nach Registrierung zurück zum Login
    this.toggleMode();
    this.error.set('Registrierung erfolgreich! Du kannst dich jetzt einloggen.');
  }
}
