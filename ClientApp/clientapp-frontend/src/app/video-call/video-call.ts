import {Component, ElementRef, Injectable, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})

@Injectable({ providedIn: 'root' })
export class VideoCall {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  private localStream?: MediaStream;
  private serverUrl = 'http://localhost:3000';
  private myId = 'clientapp';
  private targetId = 'controlcenter';

  constructor(private signaling: SignalingService) {
    this.signaling.connect(this.serverUrl, this.myId);
    this.signaling.on('incoming-call', (p: any) => {
      console.log('incoming-call', p);
    });

    this.signaling.on('call-answer', async (p: any) => {
      if (p.sdp && this.pc) {
        await this.pc.setRemoteDescription(p.sdp);
      }
    });

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        try { await this.pc.addIceCandidate(p.candidate); } catch (e) { console.warn(e); }
      }
    });
  }

  async startCall() {
    try {
      this.signaling.emit('call-request', { to: this.targetId, from: this.myId, metadata: { reason: 'video-call' } });

      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localVideo.nativeElement.srcObject = this.localStream;

      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      this.pc.ontrack = (ev) => {
        this.remoteVideo.nativeElement.srcObject = ev.streams[0];
      };

      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { to: this.targetId, from: this.myId, candidate: ev.candidate });
        }
      };

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      this.signaling.emit('call-offer', { to: this.targetId, from: this.myId, sdp: this.pc.localDescription });
    } catch (err) {
      console.error('startCall error', err);
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
