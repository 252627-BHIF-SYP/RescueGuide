import { Component, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EmergencyService } from '../services/emergency.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatButton, MatIconButton, MatIcon, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  public auth = inject(AuthService);
  public emergencyService = inject(EmergencyService);
  private router = inject(Router);

  public isExpanded = true;

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  simulateEmergency() {
    this.emergencyService.isActive.set(true);
    this.emergencyService.resetTimer();
    this.emergencyService.startTimer();
    this.emergencyService.protocol.set({
      type: 'Test-Notfall',
      callerName: 'Muster Anrufer',
      callerType: 'Privat',
      callbackNumber: '0123 456789',
      address: 'Teststraße 1, 1010 Wien',
      injuredCount: '1',
      description: 'Dies ist ein gemockter Notruf zum Testen der Ansicht.',
      dispatcherName: this.auth.userName() || 'Disponent',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      alarmedRD: true,
      alarmedNA: false,
      alarmedPol: false,
      alarmedFW: true
    });
    this.router.navigate(['/emergency-page']);
  }
}
