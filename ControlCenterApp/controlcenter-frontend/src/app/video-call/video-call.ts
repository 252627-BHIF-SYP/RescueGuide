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
  public localStream?: MediaStream; // public, damit HTML darauf zugreifen kann
  
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';
  private targetId = 'clientapp';

  private signaling = inject(SignalingService);

  ngOnInit() {
    this.initSignaling();
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    // Sobald ein Offer reinkommt, wird handleOffer SOFORT aufgerufen
    this.signaling.on('call-offer', async (p: any) => {
      console.log('Eingehender Anruf: Starte automatische Verbindung...');
      if (p.sdp) {
        await this.handleOffer(p.from, p.sdp);
      }
    });

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate));
        } catch (e) {
          console.warn('ICE Error:', e);
        }
      }
    });

    this.signaling.on('call-end', () => {
      this.closeConnection();
    });
  }

  private async handleOffer(from: string, sdp: any) {
    try {
      // 1. Medienzugriff (Kamera/Mikro)
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      // 2. WebRTC Verbindung initialisieren
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // 3. Eigene Tracks hinzufügen
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      // 4. Remote Video Stream empfangen
      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = ev.streams[0];
        }
      };

      // 5. ICE Candidates senden
      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { 
            to: from, from: this.myId, candidate: ev.candidate 
          });
        }
      };

      // 6. SDP Handshake (Answer erstellen)
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // 7. Antwort zurückschicken
      this.signaling.emit('call-answer', { 
        to: from, from: this.myId, sdp: this.pc.localDescription 
      });

      console.log('Verbindung automatisch hergestellt.');
    } catch (err) {
      console.error('Auto-Annahme fehlgeschlagen:', err);
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
  }
}