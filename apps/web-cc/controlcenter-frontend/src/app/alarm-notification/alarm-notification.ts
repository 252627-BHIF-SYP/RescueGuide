import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AlarmService, AlarmData } from '../services/alarm.service';
import { AuthService } from '../services/auth.service';
import { SignalingService } from '../services/signaling.service';
import { CallContextService } from '../services/call-context.service';
import { EmergencyService } from '../services/emergency.service';
import { InstructionFlowService } from '../services/instruction-flow.service';
import { environment } from '../../environments/environment';
import { Subscription } from 'rxjs';

const ALARM_EXIT_DURATION_MS = 140;

@Component({
  selector: 'app-alarm-notification',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './alarm-notification.html',
  styleUrls: ['./alarm-notification.scss'],
})
export class AlarmNotificationComponent implements OnInit, OnDestroy {
  @ViewChild('acceptBtn') acceptBtn?: ElementRef<HTMLButtonElement>;

  private alarmService = inject(AlarmService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);
  private emergencyService = inject(EmergencyService);
  private instructionFlow = inject(InstructionFlowService);
  private cdr = inject(ChangeDetectorRef);

  activeAlarm = signal<AlarmData | null>(null);
  isClosing = signal<boolean>(false);
  private audio = new Audio('assets/sounds/alarm_tone.mp3');
  private alarmSub?: Subscription;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private focusTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    // 1. Abonniere den zentralen Alarm-Stream (inkl. GPS-Updates vom Mobile)
    this.alarmSub = this.alarmService.alarmStream$.subscribe((data) => {
      const hadAlarm = this.activeAlarm() !== null;
      this.activeAlarm.set(data);
      if (data) {
        if (this.closeTimer) {
          clearTimeout(this.closeTimer);
          this.closeTimer = undefined;
        }
        this.isClosing.set(false);
        this.playAlarm();
        this.cdr.detectChanges();
        if (!hadAlarm) {
          if (this.focusTimer) clearTimeout(this.focusTimer);
          this.focusTimer = setTimeout(() => {
            this.acceptBtn?.nativeElement?.focus();
            this.focusTimer = undefined;
          }, 0);
        }
      } else {
        if (this.focusTimer) {
          clearTimeout(this.focusTimer);
          this.focusTimer = undefined;
        }
        this.isClosing.set(false);
        this.audio.pause();
        this.cdr.detectChanges();
      }
    });

    // Registriere als 'controlcenter' am Signaling Server
    this.signaling.connect(environment.signalingUrl, 'controlcenter');

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
    this.signaling.on('ice-candidate', (payload: any) => {
      if (payload && payload.candidate) {
        console.log('🧊 [Global] Frühen ICE-Candidate abgefangen und gespeichert!');
        this.callContext.addEarlyCandidate(payload.candidate);
      }
    });
  }

  private playAlarm() {
    this.audio.loop = true;
    this.audio.play().catch((err) => console.log('Audio Playback blocked by browser', err));
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.activeAlarm() || this.isClosing()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.onReject();
      return;
    }

    if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const activeEl = document.activeElement;
      if (activeEl instanceof HTMLButtonElement && activeEl !== this.acceptBtn?.nativeElement) {
        return;
      }
      event.preventDefault();
      this.onAccept();
    }
  }

  isLocationPending(): boolean {
    return this.activeAlarm()?.location === 'Standort wird ermittelt...';
  }

  onAccept() {
    const alarm = this.activeAlarm();
    if (!alarm || this.isClosing()) return;

    this.audio.pause();
    this.isClosing.set(true);

    // Notfall in DB anlegen und Protokoll mit Startdaten vorbelegen
    const now = new Date();
    const initialAddress =
      alarm.location === 'Unbekannter Standort' ||
      alarm.location === 'Standort wird ermittelt...' ||
      alarm.location.startsWith('Koordinaten:')
        ? ''
        : alarm.location;
    // Neuer Einsatz -> leerer Maßnahmen-Ablauf
    this.instructionFlow.reset();
    this.emergencyService.setActiveCallerLocation(alarm.id, alarm.lat, alarm.lng);
    this.emergencyService.createEmergency({
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].substring(0, 5),
      address: initialAddress,
      type: [
        'Medizinischer Notfall',
        'Verkehrsunfall',
        'Brand',
        'Polizeilicher Notfall',
        'Technische Hilfeleistung',
      ].includes(alarm.type)
        ? alarm.type
        : 'Sonstiges',
    });

    // Sende Akzeptanz-Event an den Ersthelfer
    this.signaling.emit('call-accepted', {
      to: alarm.id,
      from: 'controlcenter',
    });

    // Informiere lokale Komponenten (z.B. VideoCall) dass der User akzeptiert hat
    try {
      this.callContext.acceptCall();
    } catch (e) {
      /* best-effort */
    }

    this.emergencyService.isActive.set(true);

    this.closeTimer = setTimeout(() => {
      this.closeTimer = undefined;
      this.isClosing.set(false);
      this.alarmService.clearAlarm();
      this.cdr.detectChanges();

      this.router.navigate(['/emergency-page']).catch(() => {
        console.warn('Zielseite /emergency-page konnte nicht geladen werden.');
        this.alarmService.clearAlarm();
      });
    }, ALARM_EXIT_DURATION_MS);
  }

  onReject() {
    const alarm = this.activeAlarm();
    if (!alarm || this.isClosing()) return;

    this.audio.pause();
    this.isClosing.set(true);

    // Sende Ablehnungs-Event an den Ersthelfer
    this.signaling.emit('call-rejected', {
      to: alarm.id,
      from: 'controlcenter',
      reason: 'declined',
    });

    this.closeTimer = setTimeout(() => {
      this.closeTimer = undefined;
      this.isClosing.set(false);
      this.alarmService.clearAlarm();
      this.cdr.detectChanges();
    }, ALARM_EXIT_DURATION_MS);
  }

  ngOnDestroy() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
    }
    if (this.focusTimer) {
      clearTimeout(this.focusTimer);
    }
    this.alarmSub?.unsubscribe();
    this.signaling.off('incoming-call');
    this.signaling.off('call-request');
    this.signaling.off('call-offer');
    this.audio.pause();
  }
}
