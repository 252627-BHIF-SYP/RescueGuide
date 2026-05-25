import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { EmergencyStateService } from '../emergency-state-service';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-connecting',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './connecting-component.html',
  styleUrls: ['./connecting-component.scss']
})
export class ConnectingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private state = inject(EmergencyStateService);
  private signaling = inject(SignalingService);

  ngOnInit() {
    this.signaling.connect(environment.signalingUrl, 'clientapp');

    // Sende den echten Notruf-Request an die Leitstelle
    this.signaling.emit('call-request', {
      from: 'clientapp',
      to: 'controlcenter',
      metadata: {
        type: 'Medizinischer Notfall',
        location: 'Lokal (Entwicklung)',
        caller: 'Ersthelfer (Web)'
      }
    });

    // Auf Zusage durch die Leitstelle warten
    this.signaling.on('call-accepted', () => {
      this.state.status.set('connected');
      this.router.navigate(['/emergency']);
    });

    // Auf Ablehnung reagieren
    this.signaling.on('call-rejected', () => {
      this.state.reset();
      this.router.navigate(['/startscreen']);
      alert('Der Anruf wurde von der Leitstelle abgelehnt.');
    });

    // Fallback falls Ziel nicht registriert / offline
    this.signaling.on('call-failed', () => {
      this.state.reset();
      this.router.navigate(['/startscreen']);
      alert('Die Leitstelle ist aktuell nicht erreichbar.');
    });
  }

  ngOnDestroy() {
    this.signaling.off('call-accepted');
    this.signaling.off('call-rejected');
    this.signaling.off('call-failed');
  }
}
