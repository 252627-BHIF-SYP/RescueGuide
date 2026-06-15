import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:developer';

class WebRTCService {
  IO.Socket? socket;
  RTCPeerConnection? _peerConnection;
  MediaStream? localStream;
  RTCVideoRenderer localRenderer = RTCVideoRenderer();
  RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  bool isMicOn = true;
  bool isCameraOn = true;
  bool isFrontCamera = false;
  bool isTorchOn = false;

  final String selfId = 'mobile-user-${DateTime.now().millisecondsSinceEpoch}';
  final String targetId = 'controlcenter';

  Function(String)? onCallFailed;
  Function()? onCallEnd;
  Function()? onCallAccepted;

  Future<void> init(String serverUrl) async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();

    await _prepareLocalMedia();

    print('-----------------------------------------');
    print('RESCUE GUIDE - WebRTC INFO');
    print('MEINE ID: $selfId');
    print('ZIEL  ID: $targetId');
    print('-----------------------------------------');

    socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket!.onAny((event, data) {
      log('SOCKET-DEBUG: Event [$event] empfangen');
    });

    socket!.onConnect((_) {
      print('SUCCESS: Verbunden mit Signaling Server');
      socket!.emit('register', selfId);
      _startCall();
    });

    // WICHTIG: Das Controlcenter sendet "call-accepted"
    socket!.on('call-accepted', (data) {
      print('INFO: Event [call-accepted] erhalten -> Transition');
      onCallAccepted?.call();
    });

    socket!.on('call-answer', (data) async {
      print('INFO: Event [call-answer] (SDP) erhalten');
      if (_peerConnection != null && data['sdp'] != null) {
        var answer = RTCSessionDescription(data['sdp']['sdp'], data['sdp']['type']);
        await _peerConnection!.setRemoteDescription(answer);
      }
      onCallAccepted?.call(); // Sicherheitshalber auch hier triggern
    });

    socket!.on('ice-candidate', (data) {
      if (_peerConnection != null && data['candidate'] != null) {
        var candidate = RTCIceCandidate(
          data['candidate']['candidate'],
          data['candidate']['sdpMid'],
          data['candidate']['sdpMLineIndex'],
        );
        _peerConnection!.addCandidate(candidate);
      }
    });

    socket!.on('call-failed', (data) => onCallFailed?.call(data['reason'] ?? 'Fehler'));
    socket!.on('call-end', (_) {
      print('INFO: Event [call-end] erhalten -> Beende Anruf');
      onCallEnd?.call();
    });
    socket!.on('call-rejected', (data) => onCallFailed?.call(data['reason'] ?? 'Abgelehnt'));

    socket!.connect();
  }

  Future<void> _prepareLocalMedia() async {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {'facingMode': isFrontCamera ? 'user' : 'environment'},
      });
      localRenderer.srcObject = localStream;
    } catch (e) {
      print('ERROR: Kamera-Fehler: $e');
    }
  }

  void toggleMic() {
    if (localStream != null) {
      isMicOn = !isMicOn;
      localStream!.getAudioTracks().forEach((track) => track.enabled = isMicOn);
    }
  }

  void toggleCamera() {
    if (localStream != null) {
      isCameraOn = !isCameraOn;
      localStream!.getVideoTracks().forEach((track) => track.enabled = isCameraOn);
    }
  }

  Future<void> switchCamera() async {
    if (localStream != null) {
      isFrontCamera = !isFrontCamera;
      final videoTrack = localStream!.getVideoTracks().first;
      await Helper.switchCamera(videoTrack);
      isTorchOn = false;
    }
  }

  Future<void> toggleTorch() async {
    if (localStream != null && !isFrontCamera) {
      try {
        isTorchOn = !isTorchOn;
        final videoTrack = localStream!.getVideoTracks().first;
        await videoTrack.setTorch(isTorchOn);
      } catch (e) {
        log('Torch-Error: $e');
      }
    }
  }

  Future<void> _startCall() async {
    try {
      if (_peerConnection != null) return;
      _peerConnection = await _createPeerConnection();
      
      // Tracks hinzufügen BEVOR das Offer erstellt wird
      if (localStream != null) {
        for (var track in localStream!.getTracks()) {
          print('INFO: Füge Track hinzu: ${track.kind}');
          await _peerConnection!.addTrack(track, localStream!);
        }
      }

      // Warten bis Tracks stabil sind
      RTCSessionDescription offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': true,
        'offerToReceiveVideo': true,
      });
      await _peerConnection!.setLocalDescription(offer);
      
      print('INFO: Sende call-request und call-offer');
      socket!.emit('call-request', {'from': selfId, 'to': targetId, 'metadata': {'type': 'emergency'}});
      socket!.emit('call-offer', {'from': selfId, 'to': targetId, 'sdp': offer.toMap()});
    } catch (e) {
      print('ERROR in _startCall: $e');
      onCallFailed?.call(e.toString());
    }
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    Map<String, dynamic> configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
        {'urls': 'stun:stun1.l.google.com:19302'},
      ],
      'sdpSemantics': 'unified-plan' // Wichtig für moderne Browser/Angular
    };

    RTCPeerConnection pc = await createPeerConnection(configuration);

    // Test Test
    pc.onIceConnectionState = (state) {
      print('>>> ICE Connection State: $state');
    };

    pc.onIceCandidate = (candidate) {
      socket!.emit('ice-candidate', {'from': selfId, 'to': targetId, 'candidate': candidate.toMap()});
    };

    pc.onTrack = (event) {
      if (event.streams.isNotEmpty) remoteRenderer.srcObject = event.streams[0];
    };

    return pc;
  }

  void dispose() {
    print('INFO: WebRTC Service Ressourcen werden freigegeben');
    localStream?.getTracks().forEach((track) {
      track.stop();
    });
    localStream?.dispose();
    localStream = null;
    _peerConnection?.close();
    _peerConnection = null;
    localRenderer.srcObject = null;
    remoteRenderer.srcObject = null;
    socket?.disconnect();
    socket = null;
  }
}
