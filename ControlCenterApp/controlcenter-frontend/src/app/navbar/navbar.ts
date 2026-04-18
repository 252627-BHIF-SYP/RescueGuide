import { Component, inject } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbar, MatButton, MatIconButton, MatIcon, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  public auth = inject(AuthService);
  private router = inject(Router);

  get status(): string {
    return this.auth.available() ? 'Verfügbar' : 'Abwesend';
  }

  get statusColor(): string {
    return this.auth.available() ? 'primary' : 'warn';
  }

  get statusIcon(): string {
    return this.auth.available() ? 'person' : 'person_off';
  }

  toggleStatus(): void {
    this.auth.toggleAvailability();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
