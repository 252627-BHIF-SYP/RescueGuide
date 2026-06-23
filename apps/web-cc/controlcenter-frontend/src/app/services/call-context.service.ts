import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export interface PendingOffer {
  sdp: any;
  from: string;
}

@Injectable({ providedIn: 'root' })
export class CallContextService {
  private pendingOffer$ = new BehaviorSubject<PendingOffer | null>(null);
  private acceptSubject = new Subject<void>();
  private acceptedFlag$ = new BehaviorSubject<boolean>(false);

  // === NEU: Der globale Auffang-Korb für frühe ICE-Candidates ===
  private earlyIceCandidates: any[] = [];

  // Called by signaling layer when an offer arrives
  setPendingOffer(sdp: any, from: string) {
    this.pendingOffer$.next({ sdp, from });
  }

  // Observable to react when an offer becomes available
  getPendingOffer$(): Observable<PendingOffer | null> {
    return this.pendingOffer$.asObservable();
  }

  // Synchronous getter
  getPendingOffer(): PendingOffer | null {
    return this.pendingOffer$.getValue();
  }

  // Clear stored offer
  clearPendingOffer() {
    this.pendingOffer$.next(null);
  }

  // Called by UI when user accepts the call
  acceptCall() {
    this.acceptSubject.next();
    this.acceptedFlag$.next(true);
  }

  // Components can subscribe to accept events
  getAccept$(): Observable<void> {
    return this.acceptSubject.asObservable();
  }

  // If a component mounts after accept happened, it can check this
  getAccepted$(): Observable<boolean> {
    return this.acceptedFlag$.asObservable();
  }

  getAcceptedValue(): boolean {
    return this.acceptedFlag$.getValue();
  }

  clearAcceptedFlag() {
    this.acceptedFlag$.next(false);
  }

  // ========================================================
  // NEUE METHODEN FÜR DIE WEBRTC ICE-CANDIDATE WARTESCHLANGE
  // ========================================================

  addEarlyCandidate(candidate: any) {
    this.earlyIceCandidates.push(candidate);
  }

  getEarlyCandidates(): any[] {
    return this.earlyIceCandidates;
  }

  clearEarlyCandidates() {
    this.earlyIceCandidates = [];
  }
}
