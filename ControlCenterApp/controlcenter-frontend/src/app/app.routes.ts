import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Logout } from './logout/logout';
import { InstructionMenu } from './instruction-menu/instruction-menu';
import { EmergencyPage } from './emergency-page/emergency-page';
import { Welcome } from './welcome/welcome';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

export const routes: Routes = [
  { path: '', component: Welcome },
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'logout', component: Logout },
  { path: 'instruction-menu', component: InstructionMenu, canActivate: [authGuard] },
  { path: 'emergency-page', component: EmergencyPage, canActivate: [authGuard] }
];
