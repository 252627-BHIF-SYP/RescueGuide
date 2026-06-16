import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; // Neu für Symbole

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
  styleUrl: './signup.scss' // Hier verknüpfen wir die SCSS-Datei explizit
})
export class Signup {
  username = signal('');
  password = signal('');
  error = signal('');
  hidePassword = signal(true); // Passwort-Sichtbarkeit umschalten

  private auth = inject(AuthService);
  private router = inject(Router);

  onSignup() {
    if (!this.username() || !this.password()) {
      this.error.set('Bitte füllen Sie alle Felder aus.');
      return;
    }

    this.auth.register(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/login']),
      error: err => this.error.set(err.error || 'Registrierung fehlgeschlagen')
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
