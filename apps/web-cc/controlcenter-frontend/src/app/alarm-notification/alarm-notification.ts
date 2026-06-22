import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AlarmService, AlarmData } from '../services/alarm.service';
import { AuthService } from '../services/auth.service';
import { SignalingService } from '../services/signaling.service';
import { CallContextService } from '../services/call-context.service';
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
  private callContext = inject(CallContextService);
  private emergencyService = inject(EmergencyService);
  private cdr = inject(ChangeDetectorRef);

  activeAlarm = signal<AlarmData | null>(null);
  private audio = new Audio('assets/sounds/alarm_tone.mp3');
  private alarmSub?: Subscription;

  ngOnInit() {
    // 1. Abonniere den zentralen Alarm-Stream (inkl. GPS-Updates vom Mobile)
    this.alarmSub = this.alarmService.alarmStream$.subscribe(data => {
      this.activeAlarm.set(data);
      if (data) {
        this.playAlarm();
      } else {
        this.audio.pause();
      }
      this.cdr.detectChanges();
    });

    // Registriere als 'controlcenter' am Signaling Server
    this.signaling.connect(environment.signalingUrl, 'controlcenter');

    // Auf echte eingehende Notrufe hören (für Legacy-Support / direkte Anrufe)
    this.signaling.on('incoming-call', (p: any) => {
      console.log('Echter eingehender Notruf empfangen von:', p.from);
      this.activeAlarm.set({
        id: p.from,
        caller: p.metadata?.caller || p.from,
        location: p.metadata?.location || 'Unbekannter Standort',
        type: p.metadata?.type || 'Notfall'
      });
      this.playAlarm();
      this.cdr.detectChanges();
    });

    // Fallback: Einige mobile Clients senden 'call-request' zuerst (wird primär vom AlarmService verarbeitet, hier für CallContext)
    this.signaling.on('call-request', (p: any) => {
      console.log('call-request empfangen, setze CallContext von:', p.from);
      this.callContext.setPendingOffer(p, p.from);
    });

    // WebRTC: Speichere call-offer zur späteren Verarbeitung (wird in VideoCall abgerufen)
    this.signaling.on('call-offer', (p: any) => {
      console.log('call-offer empfangen, speichere in CallContext von:', p.from);
      if (p && p.sdp) {
        this.callContext.setPendingOffer(p.sdp, p.from);
      }
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

      // Notfall in DB anlegen und Protokoll mit Startdaten vorbelegen
      const now = new Date();
      this.emergencyService.createEmergency({
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

      // Informiere lokale Komponenten (z.B. VideoCall) dass der User akzeptiert hat
      try { this.callContext.acceptCall(); } catch (e) { /* best-effort */ }

      this.emergencyService.isActive.set(true);
      this.emergencyService.resetTimer();
      this.emergencyService.startTimer();

      // Alarm in der UI und im Service zurücksetzen
      this.alarmService.clearAlarm();
      this.cdr.detectChanges();

      this.router.navigate(['/emergency-page'])
        .catch(() => {
          console.warn('Zielseite /emergency-page konnte nicht geladen werden.');
          this.alarmService.clearAlarm();
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

      // Alarm komplett abbrechen
      this.alarmService.clearAlarm();
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.alarmSub?.unsubscribe();
    this.signaling.off('incoming-call');
    this.signaling.off('call-request');
    this.signaling.off('call-offer');
    this.audio.pause();
  }
}
