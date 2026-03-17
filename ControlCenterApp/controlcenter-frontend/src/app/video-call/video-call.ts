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
  
  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';
  private targetId = 'clientapp';

  // Hier speichern wir das Angebot, bis der User auf "Annehmen" klickt
  private pendingOffer: any = null; 
  incomingFrom: string | null = null;

  private signaling = inject(SignalingService);

  ngOnInit() {
    this.initSignaling();
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    this.signaling.connect(this.serverUrl, this.myId);

    // Event: Ein Anruf kommt rein (Signaling-Ebene)
    this.signaling.on('incoming-call', (p: any) => {
      console.log('Anruf-Signal von:', p.from);
      this.incomingFrom = p.from;
    });

    // Event: Das WebRTC-Angebot (SDP) kommt an
    this.signaling.on('call-offer', async (p: any) => {
      console.log('WebRTC Offer erhalten von:', p.from);
      this.incomingFrom = p.from;
      this.pendingOffer = p; // Angebot zwischenspeichern
    });

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate)).catch(console.warn);
      }
    });

    this.signaling.on('call-end', () => this.closeConnection());
  }

  /**
   * Wird vom Button "Annehmen" im HTML aufgerufen
   */
  async acceptCall() {
    if (!this.pendingOffer) {
      console.warn("Kein Anruf zum Annehmen vorhanden.");
      return;
    }

    console.log('Anruf wird angenommen, Kamera startet...');
    await this.handleOffer(this.pendingOffer.from, this.pendingOffer.sdp);
    
    // UI zurücksetzen (Button ausblenden)
    this.pendingOffer = null;
    this.incomingFrom = null;
  }

  private async handleOffer(from: string, sdp: any) {
    try {
      // 1. Kamera & Mikrofon aktivieren
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      if (this.localVideo) {
        this.localVideo.nativeElement.srcObject = this.localStream;
      }

      // 2. PeerConnection erstellen
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // 3. Eigene Medien-Tracks hinzufügen
      this.localStream.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

      // 4. Remote-Stream (vom Client) empfangen
      this.pc.ontrack = (ev) => {
        if (this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = ev.streams[0];
        }
      };

      // 5. ICE Candidates verschicken
      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.signaling.emit('ice-candidate', { 
            to: from, from: this.myId, candidate: ev.candidate 
          });
        }
      };

      // 6. Verbindung herstellen (SDP Handshake)
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // 7. Antwort an Client senden
      this.signaling.emit('call-answer', { 
        to: from, from: this.myId, sdp: this.pc.localDescription 
      });

    } catch (err) {
      console.error('Kamera konnte nicht gestartet werden:', err);
      alert("Kamera-Zugriff verweigert oder nicht möglich (HTTPS/Chrome Flags prüfen!)");
    }
  }

  endCall() {
    this.signaling.emit('call-end', { to: this.targetId, from: this.myId });
    this.closeConnection();
  }

  private closeConnection() {
    if (this.pc) { this.pc.close(); this.pc = undefined; }
    if (this.localStream) { this.localStream.getTracks().forEach(t => t.stop()); this.localStream = undefined; }
    this.incomingFrom = null;
    this.pendingOffer = null;
  }
}