import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {Navbar} from './navbar/navbar';
import {AlarmNotificationComponent} from './alarm-notification/alarm-notification';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, AlarmNotificationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('controlcenter-frontend');
}
