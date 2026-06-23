import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';
import { CallContextService } from '../services/call-context.service';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule, MatButton],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  // Nur noch das Remote-Video vom Smartphone wird referenziert
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;

  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';

  incomingFrom: string | null = null;
  activeCallId: string | null = null;
  pendingOffer: any = null;

  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);

  ngOnInit() {
    this.initSignaling();

    // Synchronisiert den CallContextService mit der UI (erkennt eingehende Offers)
    this.callContext.getPendingOffer$().subscribe(offer => {
      if (offer) {
        console.log('📡 [Signal] Neues Angebot im Context Service gefunden von:', offer.from);
        this.incomingFrom = offer.from;
        this.pendingOffer = offer.sdp;
      } else {
        this.incomingFrom = null;
        this.pendingOffer = null;
      }
    });

    // Falls das Signal zum Annehmen von einer externen Komponente (z.B. globaler Notification) kommt
    this.callContext.getAccept$().subscribe(() => {
      console.log('✅ [CallContext] Anruf wurde extern via Service angenommen.');
      const pending = this.callContext.getPendingOffer();
      if (pending) {
        this.handleOffer(pending.from, pending.sdp).catch(err => console.error(err));
        this.callContext.clearPendingOffer();
      }
    });

    // Falls die andere Komponente "accept" gefeuert hat, bevor diese Komponente geladen war
    if (this.callContext.getAcceptedValue()) {
      console.log('⚡ [CallContext] Vorab-Akzeptierung erkannt.');
      const pendingNow = this.callContext.getPendingOffer();
      if (pendingNow) {
        this.handleOffer(pendingNow.from, pendingNow.sdp).catch(err => console.error(err));
        this.callContext.clearPendingOffer();
        this.callContext.clearAcceptedFlag();
      }
    }
  }

  ngOnDestroy() {
    this.endCall();
  }

  private initSignaling() {
    console.log('🔌 [Signal] Verbinde mit Signaling-Server:', this.serverUrl);
    this.signaling.connect(this.serverUrl, this.myId);

    // ICE-Candidates austauschen
    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate && this.pc) {
        try {
          await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate));
          console.log('🧊 [WebRTC] ICE Candidate von Gegenseite erfolgreich verarbeitet.');
        } catch (e) {
          console.warn('⚠️ [WebRTC] Fehler beim Hinzufügen des ICE Candidates:', e);
        }
      }
    });

    // Anruf wurde von Gegenseite beendet
    this.signaling.on('call-end', () => {
      console.log('🛑 [Signal] Gegenseite (Handy) hat den Anruf beendet.');
      this.closeConnection();
    });
  }

  // Klick auf "Annehmen" im eigenen HTML-Template
  async acceptCall() {
    console.log('📞 [UI] "Annehmen" geklickt für Anrufer:', this.incomingFrom);
    if (this.incomingFrom && this.pendingOffer) {
      const callerId = this.incomingFrom;
      const offer = this.pendingOffer;

      this.activeCallId = callerId;
      this.incomingFrom = null;
      this.pendingOffer = null;
      this.callContext.clearPendingOffer();

      await this.processOffer(callerId, offer);
    } else {
      console.warn('⚠️ [UI] Annehmen geklickt, aber keine Daten vorhanden.');
    }
  }

  async processOffer(from: string, sdp: any) {
    try {
      console.log('🎙️ [Media] Fordere reines Audio-Mikrofon an (kein lokales Video)...');
      // Hier wird VIDEO auf FALSE gesetzt, damit die Leitstelle kein Kamerabild überträgt
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      console.log('✅ [Media] Mikrofon-Stream erfolgreich initialisiert.');

      console.log('🌐 [WebRTC] Erstelle PeerConnection...');
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Füge nur die Leitstellen-Audiospur hinzu, damit das Handy uns hören kann
      this.localStream.getTracks().forEach(t => {
        console.log(`📤 [WebRTC] Sende eigenen Track an Handy: ${t.kind}`);
        this.pc!.addTrack(t, this.localStream!);
      });

      // EVENT: Hier kommt der Video/Audio-Stream vom Handy an
      this.pc.ontrack = (ev) => {
        console.log(`📥 [WebRTC] Stream-Track vom Handy empfangen! Typ: ${ev.track.kind}`);

        if (this.remoteVideo) {
          if (ev.streams && ev.streams[0]) {
            console.log('📺 [WebRTC] Binde eingehenden Video-Stream an <video #remoteVideo>');
            this.remoteVideo.nativeElement.srcObject = ev.streams[0];
          } else {
            console.log('📺 [WebRTC] Fallback: Track manuell an MediaStream binden.');
            let stream = this.remoteVideo.nativeElement.srcObject as MediaStream;
            if (!stream) {
              stream = new MediaStream();
              this.remoteVideo.nativeElement.srcObject = stream;
            }
            stream.addTrack(ev.track);
          }
        } else {
          console.error('❌ [UI] Das #remoteVideo Element existiert nicht im DOM!');
        }
      };

      // Lokale ICE Candidates an das Handy senden
      this.pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          console.log('🧊 [WebRTC] Generiere lokalen ICE Candidate -> sende an Handy.');
          this.signaling.emit('ice-candidate', {
            to: from,
            from: this.myId,
            candidate: ev.candidate
          });
        }
      };

      console.log('🤝 [WebRTC] Setze Remote-Description (SDP-Offer vom Handy)...');
      await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));

      console.log('🤝 [WebRTC] Erstelle SDP-Answer...');
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      console.log('🚀 [Signal] Sende Antwort (SDP-Answer) zurück an das Handy.');
      this.signaling.emit('call-answer', {
        to: from,
        from: this.myId,
        sdp: this.pc.localDescription
      });

    } catch (err) {
      console.error('❌ [WebRTC] Fehler während des Verbindungsaufbaus:', err);
      this.closeConnection();
    }
  }

  rejectCall() {
    console.log('🚫 [UI] Anruf abgelehnt.');
    if (this.incomingFrom) {
      this.signaling.emit('call-end', { to: this.incomingFrom, from: this.myId });
    }
    this.incomingFrom = null;
    this.pendingOffer = null;
    this.callContext.clearPendingOffer();
  }

  endCall() {
    console.log('🛑 [UI] Laufenden Einsatz manuell beendet.');
    if (this.activeCallId) {
      this.signaling.emit('call-end', { to: this.activeCallId, from: this.myId });
    }
    this.closeConnection();
  }

  private closeConnection() {
    console.log('🧹 [Cleanup] Schließe WebRTC-Verbindung und stoppe lokale Medien...');
    if (this.pc) {
      this.pc.close();
      this.pc = undefined;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = undefined;
    }
    this.incomingFrom = null;
    this.pendingOffer = null;
    this.activeCallId = null;
  }

  private async handleOffer(from: string, sdp: any) {
    this.activeCallId = from;
    await this.processOffer(from, sdp);
  }
}
