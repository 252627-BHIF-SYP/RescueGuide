import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AlarmService, AlarmData } from '../services/alarm.service';
import { AuthService } from '../services/auth.service';
import { SignalingService } from '../services/signaling.service';
import { EmergencyService } from '../services/emergency.service';
import { environment } from '../../environments/environment';
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
  private signaling = inject(SignalingService);
  private emergencyService = inject(EmergencyService);
  private cdr = inject(ChangeDetectorRef);

  activeAlarm = signal<AlarmData | null>(null);
  private audio = new Audio('assets/sounds/alarm_tone.mp3');
  private alarmSub?: Subscription;

  ngOnInit() {
    // Mock-Alarm-Support erhalten
    this.alarmSub = this.alarmService.alarmStream$.subscribe(data => {
      this.activeAlarm.set(data);
      this.playAlarm();
      this.cdr.detectChanges();
    });

    // Registriere als 'controlcenter' am Signaling Server
    this.signaling.connect(environment.signalingUrl, 'controlcenter');

    // Auf echte eingehende Notrufe hören
    this.signaling.on('incoming-call', (p: any) => {
      console.log('Echter eingehender Notruf empfangen von:', p.from);
      this.activeAlarm.set({
        id: p.from, // z. B. 'clientapp'
        caller: p.metadata?.caller || p.from,
        location: p.metadata?.location || 'Unbekannter Standort',
        type: p.metadata?.type || 'Notfall'
      });
      this.playAlarm();
      this.cdr.detectChanges();
    });
  }

  private playAlarm() {
    this.audio.loop = true;
    this.audio.play().catch(err => console.log('Audio Playback blocked by browser', err));
  }

  onAccept() {
    const alarm = this.activeAlarm();
    if (alarm) {
      this.audio.pause();

      // Sende Akzeptanz-Event an den Ersthelfer
      this.signaling.emit('call-accepted', {
        to: alarm.id,
        from: 'controlcenter'
      });
      
      this.emergencyService.isActive.set(true);

      this.activeAlarm.set(null); 
      this.cdr.detectChanges();

      this.router.navigate(['/emergency-page'])
        .catch(() => {
          console.warn('Zielseite /emergency-page konnte nicht geladen werden.');
        });
    }
  }

  onReject() {
    const alarm = this.activeAlarm();
    if (alarm) {
      this.audio.pause();

      // Sende Ablehnungs-Event an den Ersthelfer
      this.signaling.emit('call-rejected', {
        to: alarm.id,
        from: 'controlcenter',
        reason: 'declined'
      });

      this.activeAlarm.set(null);
    }
  }

  ngOnDestroy() {
    this.alarmSub?.unsubscribe();
    this.signaling.off('incoming-call');
    this.audio.pause();
  }
}