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
  private localStream?: MediaStream;
  
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

    // WebRTC: Der Client schickt sein Angebot (Offer)
    this.signaling.on('call-offer', async (p: any) => {
      if (p.sdp) {
        await this.handleOffer(p.from, p.sdp);
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
      // Leitstelle sendet meistens nur Audio zurück (oder Video optional)
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, // Ändern auf 'false', wenn die Leitstelle nicht gesehen werden soll
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

      // Remote Stream (vom Client/Handy) empfangen
      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
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
      
      this.incomingFrom = null;
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
    console.log('Video-Call beendet');
  }

  async acceptCall() {
    console.log('Anruf-Button geklickt');
    if (this.incomingFrom) {
      this.incomingFrom = null; 
    }
  }
}