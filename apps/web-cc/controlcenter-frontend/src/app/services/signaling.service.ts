import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket?: Socket;

  connect(serverUrl: string, userId: string) {
    this.socket = io(serverUrl);
    this.socket.on('connect', () => {
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
    this.socket?.emit(event, payload);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
