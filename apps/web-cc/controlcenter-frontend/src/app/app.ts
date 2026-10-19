import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AlarmNotificationComponent } from './alarm-notification/alarm-notification';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AlarmNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('controlcenter-frontend');
}
