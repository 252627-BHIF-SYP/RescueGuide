import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  username = '';
  password = '';
  error = signal('');

  private auth = inject(AuthService);
  private router = inject(Router);

  onLogin() {
    // Passwort: "123456"
    if (this.password === '123456' && this.username.trim() !== '') {
      this.auth.login(this.username);
      this.router.navigate(['/emergency-page']);
    } else {
      this.error.set('Name erforderlich oder Passwort falsch.');
    }
  }
}
