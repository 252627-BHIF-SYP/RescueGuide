import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username = signal('');
  password = signal('');
  error = signal('');
  hidePassword = signal(true);

  private auth = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    if (!this.username() || !this.password()) {
      this.error.set('Bitte füllen Sie alle Felder aus.');
      return;
    }

    this.auth.login(this.username(), this.password()).subscribe({
      next: () => this.router.navigate(['/emergency-page']),
      error: () => this.error.set('Login fehlgeschlagen. Bitte Daten prüfen.')
    });
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
