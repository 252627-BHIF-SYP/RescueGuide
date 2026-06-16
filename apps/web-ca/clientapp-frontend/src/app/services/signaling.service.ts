import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket?: Socket;

  connect(serverUrl: string, userId: string) {
    if (this.socket) {
      console.log('Reusing existing signaling socket for:', userId);
      this.socket.emit('register', userId);
      return;
    }

    console.log('Connecting to signaling server as:', userId);
    this.socket = io(serverUrl);
    this.socket.on('connect', () => {
      console.log('Signaling socket connected as:', userId);
      this.socket!.emit('register', userId);
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
