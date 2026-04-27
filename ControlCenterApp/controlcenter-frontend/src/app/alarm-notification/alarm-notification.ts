import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlarmService, AlarmData } from '../services/alarm.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alarm-notification',
  standalone: true, 
  imports: [], 
  templateUrl: './alarm-notification.html',
  styleUrls: ['./alarm-notification.scss']
})
export class AlarmNotificationComponent implements OnInit, OnDestroy {
  private alarmService = inject(AlarmService);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeAlarm: AlarmData | null = null;
  private audio = new Audio('assets/sounds/alarm_tone.mp3');
  private alarmSub?: Subscription;

  ngOnInit() {
    this.alarmSub = this.alarmService.alarmStream$.subscribe(data => {
      this.activeAlarm = data;
      this.playAlarm();
    });
  }

  private playAlarm() {
    this.audio.loop = true;
    this.audio.play().catch(err => console.log('Audio Playback blocked by browser', err));
  }

  onAccept() {
    if (this.activeAlarm) {
      this.audio.pause();
      
      this.router.navigate(['/emergency-page'])
        .then(success => {
          if (success) {
            this.activeAlarm = null; 
          }
        })
        .catch(() => {
          console.warn('Zielseite /emergency-page konnte nicht geladen werden.');
          this.activeAlarm = null; 
        });
    }
  }

  onReject() {
    this.audio.pause();
    this.activeAlarm = null;
  }

  ngOnDestroy() {
    this.alarmSub?.unsubscribe();
    this.audio.pause();
  }
}