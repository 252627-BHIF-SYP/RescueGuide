import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Für strukturelle Direktiven im Template
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // <-- Behebt NG8001 (mat-icon) im Login

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule // <-- Hier registriert
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  // Auf Signals umgestellt, damit [ngModel]="username()" und username.set($event) im HTML klappen
  username = signal<string>('');
  password = signal<string>('');
  error = signal<string>('');

  // Die vom HTML erwartete Property für das Passwort-Auge
  hidePassword = signal<boolean>(true);

  private auth = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    // Werte werden bei Signals über () ausgelesen
    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.error.set('Login fehlgeschlagen')
    });
  }

  // Hilfsmethode, falls das Passwort-Auge im HTML darauf triggert
  togglePasswordVisibility() {
    this.hidePassword.set(!this.hidePassword());
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
