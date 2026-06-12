import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { SignalingService } from '../services/signaling.service';
import { EmergencyService } from '../services/emergency.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatIcon, MatIconButton],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;
  public isMuted = false;
  
  // Nutzt die zentrale URL aus der Environment-Datei
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';
  private targetId = 'clientapp';


  // Signal Service injecten
  private signaling = inject(SignalingService);
  private router = inject(Router);
  private emergencyService = inject(EmergencyService);

  ngOnInit() {
    this.initSignaling();
  }

  ngOnDestroy() {
    this.endCall();
    this.signaling.off('call-offer', this.onCallOffer);
    this.signaling.off('ice-candidate', this.onIceCandidate);
    this.signaling.off('call-end', this.onCallEnd);
  }

  private onCallOffer = async (p: any) => {
    if (p.sdp) {
      await this.handleOffer(p.from, p.sdp);
    }
  };

  private onIceCandidate = async (p: any) => {
    if (p.candidate && this.pc) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate));
      } catch (e) {
        console.warn('ICE Candidate Error:', e);
      }
    }
  };

  private onCallEnd = () => {
    console.log('Call ended by signaling event, returning to instruction menu.');
    this.closeConnection();
    this.emergencyService.isActive.set(false);
    this.router.navigate(['/instruction-menu']);
  };

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    // WebRTC: Der Client schickt sein Angebot (Offer)
    this.signaling.on('call-offer', this.onCallOffer);

    // WebRTC: ICE Candidates austauschen
    this.signaling.on('ice-candidate', this.onIceCandidate);

    this.signaling.on('call-end', this.onCallEnd);
  }

  // Wird aufgerufen, wenn der Leitstellen-Mitarbeiter auf "Annehmen" klickt
  async handleOffer(from: string, sdp: any) {
    try {
      // Leitstelle sendet nur Audio zurück (um Ressourcen-Konflikte bei lokaler Kamera zu vermeiden)
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
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

    } catch (err) {
      console.error('Fehler bei der Anrufannahme:', err);
    }
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isMuted = !audioTrack.enabled;
      }
    }
  }

  toggleVideoFullscreen() {
    if (this.remoteVideo && this.remoteVideo.nativeElement) {
      const elem = this.remoteVideo.nativeElement;
      if (!document.fullscreenElement) {
        elem.requestFullscreen().catch((err: any) => {
          console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }

  endCall() {
    this.signaling.emit('call-end', { to: this.targetId, from: this.myId });
    this.closeConnection();
    this.emergencyService.isActive.set(false);
    this.router.navigate(['/instruction-menu']);
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
    console.log('Video-Call beendet');
  }


}