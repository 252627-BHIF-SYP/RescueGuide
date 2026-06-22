import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Navbar} from './navbar/navbar';
import {AlarmNotificationComponent} from './alarm-notification/alarm-notification';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, AlarmNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('controlcenter-frontend');
  protected auth = inject(AuthService);
}
