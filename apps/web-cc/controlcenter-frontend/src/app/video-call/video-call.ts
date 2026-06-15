import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, MatButton],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;
  private pendingOffer?: RTCSessionDescription;

  // Nutzt die zentrale URL aus der Environment-Datei
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';
  private targetId = 'clientapp';

  incomingFrom: string | null = null;

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

    // Wenn ein Anruf reinkommt, speichern wir, von wem er kommt (für das UI)
    this.signaling.on('incoming-call', (p: any) => {
      console.log('Eingehender Anruf von:', p.from);
      this.incomingFrom = p.from;
    });

    // WebRTC: Der Client schickt sein Angebot (Offer) - speichern, aber nicht sofort verarbeiten
    this.signaling.on('call-offer', (p: any) => {
      if (p.sdp) {
        console.log('Offer empfangen, warte auf User-Accept...');
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
  async handleOffer(from: string, sdp: any) {
    try {
      console.log('Starte WebRTC Handshake nach User-Accept');

      // Leitstelle sendet meistens nur Audio zurück (oder Video optional)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true, // Ändern auf 'false', wenn die Leitstelle nicht gesehen werden soll
        audio: true
      });

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // **WICHTIG: ontrack MUSS ZUERST registriert werden, BEVOR setRemoteDescription!**
      this.pc.ontrack = (ev) => {
        console.log('✅ Remote Track erhalten:', ev.track.kind);
        if (this.remoteVideo && ev.streams[0]) {
          console.log('Remote Stream wird angezeigt');
          this.remoteVideo.nativeElement.srcObject = ev.streams[0];
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

      // Eigene Tracks hinzufügen BEVOR RemoteDescription
      this.localStream.getTracks().forEach(t => {
        console.log('Füge lokalen Track hinzu:', t.kind);
        this.pc!.addTrack(t, this.localStream!);
      });

      // WICHTIG: setRemoteDescription erst NACH ontrack Handler
      console.log('Setze Remote Description...');
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Antwort (Answer) zurück an den Client senden
      this.signaling.emit('call-answer', {
        to: from,
        from: this.myId,
        sdp: this.pc.localDescription
      });

      console.log('WebRTC Verbindung initialisiert');
    } catch (err) {
      console.error('Fehler bei der Anrufannahme:', err);
    }
  }

  endCall() {
    this.signaling.emit('call-end', { to: this.targetId, from: this.myId });
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
    this.pendingOffer = undefined;
    console.log('Video-Call beendet');
  }

  async acceptCall() {
    console.log('Anruf akzeptiert - starte WebRTC Handshake');
    if (this.incomingFrom && this.pendingOffer) {
      await this.handleOffer(this.incomingFrom, this.pendingOffer);
      this.incomingFrom = null;
      this.pendingOffer = undefined;
    }
  }
}
