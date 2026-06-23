import { Component, ElementRef, ViewChild, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalingService } from '../services/signaling.service';
import { environment } from '../../environments/environment';
import { CallContextService } from '../services/call-context.service';

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-call.html',
  styleUrls: ['./video-call.scss']
})
export class VideoCall implements OnInit, OnDestroy {
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private pc?: RTCPeerConnection;
  public localStream?: MediaStream;

  private serverUrl = environment.signalingUrl;
  private myId = 'controlcenter';

  incomingFrom: string | null = null;
  activeCallId: string | null = null;
  pendingOffer: any = null;

  // Lokale Warteschlange
  private iceCandidateQueue: any[] = [];
  private isRemoteDescriptionSet = false;

  private signaling = inject(SignalingService);
  private callContext = inject(CallContextService);

  ngOnInit() {
    this.initSignaling();

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

    this.callContext.getAccept$().subscribe(() => {
      console.log('✅ [CallContext] Anruf wurde extern via Service angenommen.');
      const pending = this.callContext.getPendingOffer();
      if (pending) {
        this.handleOffer(pending.from, pending.sdp).catch(err => console.error(err));
        this.callContext.clearPendingOffer();
      }
    });

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

    this.signaling.on('ice-candidate', async (p: any) => {
      if (p.candidate) {
        if (this.pc && this.isRemoteDescriptionSet) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(p.candidate));
            console.log('🧊 [WebRTC] ICE Candidate von Gegenseite erfolgreich verarbeitet.');
          } catch (e) {
            console.warn('⚠️ [WebRTC] Fehler beim Hinzufügen des ICE Candidates:', e);
          }
        } else {
          console.log('⏳ [WebRTC] PC noch nicht bereit. Candidate in lokale Warteschlange gelegt.');
          this.iceCandidateQueue.push(p.candidate);
        }
      }
    });

    this.signaling.on('call-end', () => {
      console.log('🛑 [Signal] Gegenseite (Handy) hat den Anruf beendet.');
      this.closeConnection();
    });
  }

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
    }
  }

  async processOffer(from: string, sdp: any) {
    try {
      console.log('🎙️ [Media] Fordere reines Audio-Mikrofon an (kein lokales Video)...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      console.log('✅ [Media] Mikrofon-Stream erfolgreich initialisiert.');

      console.log('🌐 [WebRTC] Erstelle PeerConnection...');
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      this.pc.oniceconnectionstatechange = () => {
        console.log(`📡 [WebRTC Status] ICE Connection State geändert auf: ${this.pc?.iceConnectionState}`);
      };

      this.localStream.getTracks().forEach(t => {
        console.log(`📤 [WebRTC] Sende eigenen Track an Handy: ${t.kind}`);
        this.pc!.addTrack(t, this.localStream!);
      });

      this.pc.ontrack = (ev) => {
        console.log(`📥 [WebRTC] Stream-Track vom Handy empfangen! Typ: ${ev.track.kind}`);

        if (this.remoteVideo) {
          if (ev.streams && ev.streams[0]) {
            console.log('📺 [WebRTC] Binde eingehenden Stream an <video #remoteVideo>');
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

          setTimeout(() => {
            this.remoteVideo.nativeElement.play().catch(err => {
              console.warn('⚠️ [Browser] Autoplay wurde blockiert. Prüfe, ob "muted" im HTML steht:', err);
            });
          }, 150);

        } else {
          console.error('❌ [UI] Das #remoteVideo Element existiert nicht im DOM!');
        }
      };

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

      // PC ist jetzt bereit für alle Candidates!
      this.isRemoteDescriptionSet = true;

      // 1. Lokale Queue abarbeiten (falls während des Starts noch was reinkam)
      while (this.iceCandidateQueue.length > 0) {
        const cand = this.iceCandidateQueue.shift();
        await this.pc!.addIceCandidate(new RTCIceCandidate(cand));
        console.log('🧊 [WebRTC] Candidate aus lokaler Warteschlange erfolgreich nachgeholt!');
      }

      // 2. Globale Queue abarbeiten (die lebenswichtigen ganz frühen Candidates)
      const earlyCands = this.callContext.getEarlyCandidates();
      if (earlyCands.length > 0) {
        console.log(`🧺 [WebRTC] Verarbeite ${earlyCands.length} global abgefangene Candidates...`);
        for (const cand of earlyCands) {
          await this.pc!.addIceCandidate(new RTCIceCandidate(cand));
        }
        console.log('🧊 [WebRTC] Alle globalen Candidates erfolgreich nachgeholt!');
        this.callContext.clearEarlyCandidates();
      }

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
    this.callContext.clearPendingOffer();
    this.closeConnection();
  }

  endCall() {
    console.log('🛑 [UI] Laufenden Einsatz manuell beendet.');
    if (this.activeCallId) {
      this.signaling.emit('call-end', { to: this.activeCallId, from: this.myId });
    }
    this.closeConnection();
  }

  private closeConnection() {
    console.log('🧹 [Cleanup] Schließe WebRTC-Verbindung und setze UI zurück...');
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
    this.iceCandidateQueue = [];
    this.isRemoteDescriptionSet = false;
    this.callContext.clearEarlyCandidates();
  }

  private async handleOffer(from: string, sdp: any) {
    this.activeCallId = from;
    await this.processOffer(from, sdp);
  }
}
