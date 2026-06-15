import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { CallContextService } from './call-context.service';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket?: Socket;

  constructor(private callContext: CallContextService) {}

  connect(serverUrl: string, userId: string) {
    this.socket = io(serverUrl);
    this.socket.on('connect', () => {
      this.socket!.emit('register', userId);
    });

    // Store incoming call-offers so UI can accept later
    this.socket.on('call-offer', (p: any) => {
      try {
        if (p && p.sdp) {
          this.callContext.setPendingOffer(p.sdp, p.from);
        }
      } catch (e) {
        console.warn('Error storing call-offer in CallContext:', e);
      }
    });
  }

  on(event: string, cb: (data: any) => void) {
    this.socket?.on(event, cb);
  }

  off(event: string, cb?: (data: any) => void) {
    if (cb) this.socket?.off(event, cb);
    else this.socket?.off(event);
  }

  emit(event: string, payload: any) {
    this.socket?.emit(event, payload);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
