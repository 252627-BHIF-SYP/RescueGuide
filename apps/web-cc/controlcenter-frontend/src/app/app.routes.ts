import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Logout } from './logout/logout';
import { InstructionMenu } from './instruction-menu/instruction-menu';
import { EmergencyPage } from './emergency-page/emergency-page';
import { Dashboard } from './dashboard/dashboard';
import { MainLayoutComponent } from './main-layout/main-layout.component';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.parseUrl('/login');
};

export const routes: Routes = [
  // Fullscreen standalone pages (No sidebar navigation)
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'logout', component: Logout },
  { path: 'emergency-page', component: EmergencyPage, canActivate: [authGuard] },

  // Dispatched operational pages (with Dispatcher Sidebar Navigation Rail)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard },
      { path: 'instruction-menu', component: InstructionMenu },
    ],
  },
  { path: '**', redirectTo: '' },
];
