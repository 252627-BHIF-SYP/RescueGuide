import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SignalingService {
  private socket?: Socket;
  private userId?: string;
  private listeners = new Map<string, Set<(data: any) => void>>();

  connect(serverUrl: string, userId: string) {
    this.userId = userId;
    if (this.socket) {
      if (this.socket.connected) this.socket.emit('register', userId);
      return;
    }
    this.socket = io(serverUrl);
    this.socket.on('connect', () => {
      this.socket!.emit('register', this.userId);
    });
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => this.socket!.on(event, callback));
    });
  }

  on(event: string, cb: (data: any) => void) {
    let callbacks = this.listeners.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(event, callbacks);
    }
    callbacks.add(cb);
    this.socket?.on(event, cb);
  }

  off(event: string, cb?: (data: any) => void) {
    if (cb) {
      this.listeners.get(event)?.delete(cb);
      this.socket?.off(event, cb);
      return;
    }
    this.listeners.delete(event);
    this.socket?.off(event);
  }

  emit(event: string, payload: any) {
    this.socket?.emit(event, payload);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
