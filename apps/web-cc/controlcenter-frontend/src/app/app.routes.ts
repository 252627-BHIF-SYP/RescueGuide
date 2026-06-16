import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Logout } from './logout/logout';
import { InstructionMenu } from './instruction-menu/instruction-menu';
import { EmergencyPage } from './emergency-page/emergency-page';
import { Dashboard } from './dashboard/dashboard';

import { EmergencyService } from './services/emergency.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

const activeEmergencyGuard = () => {
  const emergencyService = inject(EmergencyService);
  const router = inject(Router);
  return emergencyService.isActive() ? true : router.parseUrl('/instruction-menu');
};

export const routes: Routes = [
  { path: '', component: Dashboard, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'logout', component: Logout },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'instruction-menu', component: InstructionMenu, canActivate: [authGuard] },
  { path: 'emergency-page', component: EmergencyPage, canActivate: [authGuard, activeEmergencyGuard] },
  { path: '**', redirectTo: '' },
];
