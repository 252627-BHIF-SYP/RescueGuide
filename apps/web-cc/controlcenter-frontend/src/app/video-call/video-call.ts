import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';

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

  ngOnInit() {
    this.initSignaling();
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    // Wenn ein Angebot (Offer) reinkommt, Daten nur speichern. Noch KEIN MediaStream starten!
    this.signaling.on('call-offer', (p: any) => {
      if (p.sdp) {
        console.log('Eingehendes WebRTC Angebot von:', p.from);
        this.incomingFrom = p.from;
        this.pendingOffer = p.sdp;
      }
    });

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
      // Leitstelle sendet meistens nur Audio zurück
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false, // Ändern auf 'true', wenn die Leitstelle gesehen werden soll
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
    if (this.remoteVideo && this.remoteVideo.nativeElement) {
      this.remoteVideo.nativeElement.srcObject = null;
    }
    this.incomingFrom = null;
    this.pendingOffer = null;
    this.activeCallId = null;
    console.log('Video-Call beendet und Ressourcen freigegeben');
  }
}
