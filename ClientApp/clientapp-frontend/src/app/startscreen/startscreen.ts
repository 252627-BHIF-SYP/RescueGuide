import {Component, inject} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';
import { Navbar } from '../navbar/navbar';
import {EmergencyStateService} from '../emergency-state-service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {VideoCall} from '../video-call/video-call';
import { Gps } from '../gps/gps';

@Component({
  selector: 'app-startscreen',
  imports: [
    RouterOutlet,
    MatProgressSpinner,
    MatIcon,
    MatIconButton,
    RouterLink,
    Gps,
    Navbar
  ],
  templateUrl: 'startscreen.html',
  styleUrl: 'startscreen.scss',
})
export class Startscreen {
  private router = inject(Router);
  state = inject(EmergencyStateService);

  private interval?: number;

  startHold() {
    this.state.status.set('holding');
    this.state.holdProgress.set(0);

    this.interval = window.setInterval(() => {
      this.state.holdProgress.update(v => v + 5);

      if (this.state.holdProgress() >= 100) {
        clearInterval(this.interval);
        this.state.status.set('connecting');
        this.router.navigate(['/connecting']);
      }
    }, 100);
  }

  stopHold() {
    clearInterval(this.interval);
    this.state.reset();
  }

}
