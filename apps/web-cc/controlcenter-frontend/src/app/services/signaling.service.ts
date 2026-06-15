import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket?: Socket;
  private anyAttached = false;
  private pendingListeners: Map<string, Array<(data: any) => void>> = new Map();

  connect(serverUrl: string, userId: string) {
    if (this.socket) {
      console.log('Reusing existing signaling socket for:', userId);
      this.socket.emit('register', userId);
      return;
    }

    console.log('Connecting to signaling server as:', userId);
    this.socket = io(serverUrl, { transports: ['websocket'], autoConnect: true });
    this.socket.on('connect', () => {
      console.log('Signaling socket connected as:', userId);
      this.socket!.emit('register', userId);
    });

    // Falls zuvor Listener via `on()` registriert wurden bevor der Socket
    // erstellt wurde, jetzt nach dem Erstellen übertragen.
    this.pendingListeners.forEach((cbs, evt) => {
      cbs.forEach(cb => this.socket!.on(evt, cb));
    });

    // Globales Debug-Logging für alle eingehenden Signaling-Events (hilft beim Troubleshooting)
    if (!this.anyAttached) {
      this.anyAttached = true;
      this.socket.onAny((event, data) => {
        console.log('SIGNALING EVENT ->', event, data);
      });
    }
  }

  on(event: string, cb: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, cb);
    } else {
      const list = this.pendingListeners.get(event) || [];
      list.push(cb);
      this.pendingListeners.set(event, list);
    }
  }

  off(event: string, cb?: (data: any) => void) {
    if (this.socket) {
      if (cb) this.socket.off(event, cb);
      else this.socket.off(event);
    } else {
      if (cb) {
        const list = this.pendingListeners.get(event) || [];
        this.pendingListeners.set(event, list.filter(fn => fn !== cb));
      } else {
        this.pendingListeners.delete(event);
      }
    }
  }

  emit(event: string, payload: any) {
    if (this.socket) {
      this.socket.emit(event, payload);
    } else {
      console.warn('Cannot emit because socket is not connected:', event);
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
  }
}
