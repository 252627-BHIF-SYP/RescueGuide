import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';
import { MatButtonModule } from '@angular/material/button'; // Wichtig für den Build

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, MatButtonModule], // MatButtonModule muss hier rein!
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;
  
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';
  private targetId = 'clientapp';
  incomingFrom: string | null = null;
  private signaling = inject(SignalingService);

  ngOnInit() {
    this.initSignaling();
    // Falls die Kamera der Leitstelle SOFORT beim Laden an sein soll:
    // this.prepareCamera(); 
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    this.signaling.on('call-offer', async (p: any) => {
      console.log('Automatischer Start...');
      this.incomingFrom = p.from;
      if (p.sdp) {
        await this.handleOffer(p.from, p.sdp);
      }
    });

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate)).catch(e => console.error(e));
      }
    });

    this.signaling.on('call-end', () => this.closeConnection());
  }

  async handleOffer(from: string, sdp: any) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = ev.streams[0];
        }
      };

      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { to: from, from: this.myId, candidate: ev.candidate });
        }
      };

      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.signaling.emit('call-answer', { to: from, from: this.myId, sdp: this.pc.localDescription });
    } catch (err) {
      console.error('Fehler:', err);
    }
  }

  endCall() {
    this.signaling.emit('call-end', { to: this.targetId, from: this.myId });
    this.closeConnection();
  }

  private closeConnection() {
    if (this.pc) { this.pc.close(); this.pc = undefined; }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = undefined;
    }
    this.incomingFrom = null;
  }
}