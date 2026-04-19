import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  private localStream?: MediaStream;
  
  // Nutzt jetzt die URL aus der Environment-Datei
  private serverUrl = environment.signalingUrl;
  private myId = 'clientapp';
  private targetId = 'controlcenter';

  private signaling = inject(SignalingService);

  ngOnInit() {
    this.initSignaling();
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    this.signaling.on('incoming-call', (p: any) => {
      console.log('Eingehender Anruf von:', p.from);
      // Hier könntest du eine Logik einbauen, um automatisch anzunehmen 
      // oder dem User einen Button anzuzeigen
    });

    this.signaling.on('call-answer', async (p: any) => {
      if (p.sdp && this.pc) {
        await this.pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
      }
    });

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

  async startCall() {
    try {
      // 1. Medien abgreifen
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      // 2. PeerConnection aufbauen
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // 3. Tracks hinzufügen
      this.localStream.getTracks().forEach(track => {
        this.pc!.addTrack(track, this.localStream!);
      });

      // 4. Remote Stream empfangen
      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = ev.streams[0];
        }
      };

      // 5. ICE Candidates senden
      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { 
            to: this.targetId, 
            from: this.myId, 
            candidate: ev.candidate 
          });
        }
      };

      // 6. Offer erstellen
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 7. Signaling informieren
      this.signaling.emit('call-offer', { 
        to: this.targetId, 
        from: this.myId, 
        sdp: this.pc.localDescription 
      });

      console.log('Call gestartet und Offer gesendet');
    } catch (err) {
      console.error('Fehler beim Starten des Videoanrufs:', err);
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
    console.log('Verbindung getrennt');
  }
}