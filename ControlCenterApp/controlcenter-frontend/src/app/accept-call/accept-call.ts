import { Component } from '@angular/core';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import {MatCard} from '@angular/material/card';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-accept-call',
  imports: [
    MatIcon,
    MatCard,
    MatButton
  ],
  templateUrl: './accept-call.html',
  styleUrl: './accept-call.scss',
})
export class AcceptCall {
  constructor(private router: Router) {}

  acceptCall() {
    console.log('Notruf akzeptiert');

    this.router.navigate(['/emergency-page']);
  }

  rejectCall() {
    console.log('Notruf abgelehnt');
    this.router.navigate(['/instruction-menu']);
  }

}
