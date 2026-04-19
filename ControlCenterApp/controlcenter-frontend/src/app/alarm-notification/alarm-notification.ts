import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlarmService, AlarmData } from '../services/alarm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alarm-notification',
  standalone: true, // Moderne Angular-Komponenten sind meist standalone
  imports: [], // Hier keine CommonModule/NgIf mehr nötig!
  templateUrl: './alarm-notification.html',
  styleUrls: ['./alarm-notification.scss']
})
export class AlarmNotificationComponent implements OnInit, OnDestroy {
  // Dependency Injection via inject() (moderner Stil)
  private alarmService = inject(AlarmService);
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
      
      // Hier findet die Navigation statt. 
      // Da die Zielseite noch nicht definiert ist, nutzen wir einen Platzhalter-Pfad.
      // Die ID des Alarms wird als URL-Parameter übergeben.
      this.router.navigate(['/dispatch', this.activeAlarm.id])
        .then(success => {
          if (success) {
            this.activeAlarm = null; // Alarm ausblenden nach erfolgreichem Wechsel
          }
        })
        .catch(() => {
          console.warn('Zielseite /dispatch noch nicht konfiguriert.');
          this.activeAlarm = null; // Fallback: Overlay trotzdem schließen
        });
    }
  }

  ngOnDestroy() {
    this.alarmSub?.unsubscribe();
    this.audio.pause();
  }
}