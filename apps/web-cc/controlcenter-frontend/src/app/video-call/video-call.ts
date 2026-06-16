import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';
import { CallContextService } from '../services/call-context.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;

  // Nutzt die zentrale URL aus der Environment-Datei
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';

  incomingFrom: string | null = null;
  activeCallId: string | null = null; // Speichert, mit wem wir aktuell verbunden sind
  pendingOffer: any = null;           // Speichert das SDP-Angebot, bis "Annehmen" geklickt wird

  // Signal Service injecten
  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);

  ngOnInit() {
    this.initSignaling();

    // Wenn der Nutzer später akzeptiert, versucht VideoCall die gespeicherte Offer
    this.callContext.getAccept$().subscribe(() => {
      const pending = this.callContext.getPendingOffer();
      if (pending) {
        // Wenn Offer schon vorhanden: direkt verarbeiten
        this.handleOffer(pending.from, pending.sdp).catch(err => console.error(err));
        this.callContext.clearPendingOffer();
      } else {
        // Wenn Offer noch nicht da, warte einmalig auf die nächste Offer
        this.callContext.getPendingOffer$().subscribe(p => {
          if (p) {
            this.handleOffer(p.from, p.sdp).catch(err => console.error(err));
            this.callContext.clearPendingOffer();
          }
        });
      }
    });
    // Falls der User bereits akzeptiert hat (AlarmNotification hat accept schon gesendet)
    if (this.callContext.getAcceptedValue()) {
      const pendingNow = this.callContext.getPendingOffer();
      if (pendingNow) {
        this.handleOffer(pendingNow.from, pendingNow.sdp).catch(err => console.error(err));
        this.callContext.clearPendingOffer();
        this.callContext.clearAcceptedFlag();
      }
    }
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    // WebRTC: ICE Candidates austauschen
    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate));
        } catch (e) {
          console.warn('ICE Candidate Error:', e);
        }
      }
    });

    this.signaling.on('call-end', () => {
      this.closeConnection();
    });
  }

  // Wird aufgerufen, wenn der Leitstellen-Mitarbeiter auf "Annehmen" klickt
  async acceptCall() {
    console.log('Anruf-Button geklickt');
    if (this.incomingFrom && this.pendingOffer) {
      const callerId = this.incomingFrom;
      const offer = this.pendingOffer;

      this.activeCallId = callerId;
      this.incomingFrom = null;
      this.pendingOffer = null;

      await this.processOffer(callerId, offer);
    }
  }

  async processOffer(from: string, sdp: any) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (this.localVideo && this.localStream) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Eigene Tracks hinzufügen
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      // Remote Stream (vom Client/Handy) empfangen - mit sicherem Fallback
      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
          if (ev.streams && ev.streams[0]) {
            this.remoteVideo.nativeElement.srcObject = ev.streams[0];
          } else {
            // Fallback für manche Browser, die ev.streams nicht sauber befüllen
            let stream = this.remoteVideo.nativeElement.srcObject as MediaStream;
            if (!stream) {
              stream = new MediaStream();
              this.remoteVideo.nativeElement.srcObject = stream;
            }
            stream.addTrack(ev.track);
          }
        }
      };

      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', {
            to: from,
            from: this.myId,
            candidate: ev.candidate
          });
        }
      };

      // Verbindung herstellen
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Antwort (Answer) zurück an den Client senden
      this.signaling.emit('call-answer', {
        to: from,
        from: this.myId,
        sdp: this.pc.localDescription
      });

    } catch (err) {
      console.error('Fehler bei der Anrufannahme:', err);
      this.closeConnection(); // Bei Fehler direkt aufräumen
    }
  }

  rejectCall() {
    if (this.incomingFrom) {
      this.signaling.emit('call-end', { to: this.incomingFrom, from: this.myId });
    }
    this.incomingFrom = null;
    this.pendingOffer = null;
  }

  endCall() {
    // Beenden-Signal an den aktiven Anrufer senden (nicht mehr hart codiert)
    if (this.activeCallId) {
      this.signaling.emit('call-end', { to: this.activeCallId, from: this.myId });
    }
    this.closeConnection();
  }

  private closeConnection() {
    if (this.pc) {
      this.pc.close();
      this.pc = undefined;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = undefined;
    }
    this.incomingFrom = null;
    this.pendingOffer = null;
    this.activeCallId = null;
    console.log('Video-Call beendet und Ressourcen freigegeben');
  }

  private async handleOffer(from: string, sdp: any) {
    this.activeCallId = from;
    await this.processOffer(from, sdp);
  }
}
