import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-logout',
  standalone: true,
  template: '',
})
export class Logout {
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
