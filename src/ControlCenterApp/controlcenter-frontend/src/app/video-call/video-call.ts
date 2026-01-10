import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  private localStream?: MediaStream;
  private serverUrl = 'http://localhost:3000';
  private myId = 'controlcenter';
  private targetId = 'clientapp';

  incomingFrom: string | null = null;

  constructor(private signaling: SignalingService) {
    this.signaling.connect(this.serverUrl, this.myId);

    this.signaling.on('incoming-call', (p: any) => {
      console.log('Incoming call', p);
      this.incomingFrom = p.from;
    });

    this.signaling.on('call-offer', async (p: any) => {
      if (p.sdp) await this.handleOffer(p.from, p.sdp);
    });

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        try { await this.pc.addIceCandidate(p.candidate); } catch (e) { console.warn(e); }
      }
    });
  }

  async acceptCall() {
    if (!this.incomingFrom) return;
    this.incomingFrom = null;
  }

  async handleOffer(from: string, sdp: any) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localVideo.nativeElement.srcObject = this.localStream;

      this.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      this.pc.ontrack = (ev) => {
        this.remoteVideo.nativeElement.srcObject = ev.streams[0];
      };

      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { to: from, from: this.myId, candidate: ev.candidate });
        }
      };

      await this.pc.setRemoteDescription(sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      this.signaling.emit('call-answer', { to: from, from: this.myId, sdp: this.pc.localDescription });
      this.incomingFrom = null;
    } catch (err) {
      console.error('handleOffer error', err);
    }
  }

  endCall() {
    this.signaling.emit('call-end', { to: this.targetId, from: this.myId });
    this.pc?.close();
    this.pc = undefined;
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = undefined;
  }
}
