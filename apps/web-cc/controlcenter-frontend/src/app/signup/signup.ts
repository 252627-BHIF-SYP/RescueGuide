import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  username = signal('');
  password = signal('');
  confirmPassword = signal('');
  error = signal('');
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  private auth = inject(AuthService);
  private router = inject(Router);

  // Benutzername-Validierung
  trimmedUsername = computed(() => this.username().trim());
  hasUsernameValidLength = computed(() => this.trimmedUsername().length >= 3 && this.trimmedUsername().length <= 30);
  hasUsernameValidChars = computed(() => /^[a-zA-Z0-9._-]+$/.test(this.trimmedUsername()));
  isUsernameValid = computed(() => this.hasUsernameValidLength() && this.hasUsernameValidChars());

  // Passwort-Validierung
  hasMinLength = computed(() => this.password().length >= 8);
  hasUpperCase = computed(() => /[A-Z]/.test(this.password()));
  hasLowerCase = computed(() => /[a-z]/.test(this.password()));
  hasNumber = computed(() => /[0-9]/.test(this.password()));
  hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(this.password()));
  isPasswordValid = computed(() =>
    this.hasMinLength() &&
    this.hasUpperCase() &&
    this.hasLowerCase() &&
    this.hasNumber() &&
    this.hasSpecialChar()
  );

  // Passwort-Wiederholung
  passwordsMatch = computed(() =>
    this.password().length > 0 &&
    this.password() === this.confirmPassword()
  );

  // Noch fehlende Passwort-Anforderungen (erst ab erster Eingabe aktiv)
  missingPasswordRequirements = computed(() => {
    if (this.password().length === 0) return [];

    const missing: string[] = [];
    if (!this.hasMinLength()) {
      missing.push('Mindestens 8 Zeichen');
    }
    if (!this.hasUpperCase() || !this.hasLowerCase()) {
      missing.push('Groß- und Kleinbuchstaben');
    }
    if (!this.hasNumber()) {
      missing.push('Mindestens eine Ziffer (0-9)');
    }
    if (!this.hasSpecialChar()) {
      missing.push('Mindestens ein Sonderzeichen (!@#$...)');
    }
    return missing;
  });

  // Zeigt Fehler an, wenn Wiederholung abweicht
  passwordMismatch = computed(() =>
    this.confirmPassword().length > 0 && !this.passwordsMatch()
  );

  // Gesamtvalidierung
  isFormValid = computed(() =>
    this.isUsernameValid() &&
    this.isPasswordValid() &&
    this.passwordsMatch()
  );

  onSignup() {
    this.error.set('');

    if (!this.trimmedUsername()) {
      this.error.set('Bitte geben Sie einen Benutzernamen ein.');
      return;
    }

    if (!this.hasUsernameValidLength()) {
      this.error.set('Der Benutzername muss zwischen 3 und 30 Zeichen lang sein.');
      return;
    }

    if (!this.hasUsernameValidChars()) {
      this.error.set('Der Benutzername darf nur Buchstaben, Zahlen, ., - und _ enthalten.');
      return;
    }

    if (!this.isPasswordValid()) {
      this.error.set('Das Passwort erfüllt noch nicht alle Sicherheitsanforderungen.');
      return;
    }

    if (!this.passwordsMatch()) {
      this.error.set('Die Passwörter stimmen nicht überein.');
      return;
    }

    this.auth.register(this.trimmedUsername(), this.password()).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => {
        const message = typeof err.error === 'string' ? err.error : (err.message || 'Registrierung fehlgeschlagen');
        this.error.set(message);
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
