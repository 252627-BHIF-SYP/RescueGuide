import { Component, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { EmergencyStateService} from '../emergency-state-service';

@Component({
  selector: 'app-connecting',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './connecting-component.html',
  styleUrls: ['./connecting-component.scss']
})
export class ConnectingComponent {

  private router = inject(Router);
  private state = inject(EmergencyStateService);

  constructor() {
    effect(() => {
      if (this.state.status() === 'connecting') {
        setTimeout(() => {
          this.state.status.set('connected');
          this.router.navigate(['/emergency']);
        }, 3000);
      }
    });
  }
}
