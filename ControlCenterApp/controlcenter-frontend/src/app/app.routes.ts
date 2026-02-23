import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Login } from './login/login';
import { InstructionMenu } from './instruction-menu/instruction-menu';
import { EmergencyPage } from './emergency-page/emergency-page';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'instruction-menu', component: InstructionMenu, canActivate: [authGuard] },
  { path: 'emergency-page', component: EmergencyPage, canActivate: [authGuard] },
  { path: '', redirectTo: 'emergency-page', pathMatch: 'full' }
];
