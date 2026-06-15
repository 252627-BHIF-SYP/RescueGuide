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
  lastEvent = signal<string | null>(null);
  connectionState = signal<string>('disconnected');
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

    // Connection state beobachten (socket.io 'connect'/'disconnect' Events)
    this.signaling.on('connect', () => {
      this.connectionState.set('connected');
      this.lastEvent.set('connect');
      this.cdr.detectChanges();
    });
    this.signaling.on('disconnect', () => {
      this.connectionState.set('disconnected');
      this.lastEvent.set('disconnect');
      this.cdr.detectChanges();
    });

    // Auf echte eingehende Notrufe hören
    this.signaling.on('incoming-call', (p: any) => {
      console.log('Echter eingehender Notruf empfangen von:', p.from);
      this.lastEvent.set('incoming-call');
      this.activeAlarm.set({
        id: p.from, // z. B. 'clientapp'
        caller: p.metadata?.caller || p.from,
        location: p.metadata?.location || 'Unbekannter Standort',
        type: p.metadata?.type || 'Notfall'
      });
      this.playAlarm();
      this.cdr.detectChanges();
    });

    // Manche Signaling-Server leiten das initiale Event als 'call-request' weiter.
    // Wir hören zusätzlich darauf, damit kein Alarm verloren geht.
    this.signaling.on('call-request', (p: any) => {
      console.log('call-request empfangen (fallback for incoming-call):', p.from);
      this.lastEvent.set('call-request');
      this.activeAlarm.set({
        id: p.from,
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

      // Notfall in DB anlegen
      this.emergencyService.createEmergency();

      // Protokoll mit Startdaten vorbelegen
      const now = new Date();
      this.emergencyService.updateProtocol({
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].substring(0, 5),
        address: alarm.location !== 'Unbekannter Standort' ? alarm.location : '',
        type: ['Medizinischer Notfall', 'Verkehrsunfall', 'Brand', 'Polizeilicher Notfall', 'Technische Hilfeleistung'].includes(alarm.type) ? alarm.type : 'Sonstiges'
      });

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
    this.signaling.off('call-request');
    this.audio.pause();
  }
}
