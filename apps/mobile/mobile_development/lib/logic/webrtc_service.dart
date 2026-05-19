import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:developer';

class WebRTCService {
  IO.Socket? socket;
  RTCPeerConnection? _peerConnection;
  MediaStream? localStream;
  RTCVideoRenderer localRenderer = RTCVideoRenderer();
  RTCVideoRenderer remoteRenderer = RTCVideoRenderer();

  final String selfId = 'mobile-user-${DateTime.now().millisecondsSinceEpoch}';
  final String targetId = 'dispatcher'; // Target to call

  Function(String)? onCallFailed;
  Function()? onCallEnd;

  Future<void> init(String serverUrl) async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();

    socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket!.onConnect((_) {
      log('Connected to signaling server');
      socket!.emit('register', selfId);
      _startCall(); // Automatically start call when connected
    });

    socket!.on('incoming-call', (data) {
      log('Incoming call from ${data['from']}');
      // For now, we are the one initiating the call in an emergency.
    });

    socket!.on('call-answer', (data) async {
      log('Received call-answer from ${data['from']}');
      var answer = RTCSessionDescription(data['sdp']['sdp'], data['sdp']['type']);
      await _peerConnection?.setRemoteDescription(answer);
    });

    socket!.on('ice-candidate', (data) {
      log('Received ice-candidate');
      var candidate = RTCIceCandidate(
        data['candidate']['candidate'],
        data['candidate']['sdpMid'],
        data['candidate']['sdpMLineIndex'],
      );
      _peerConnection?.addCandidate(candidate);
    });

    socket!.on('call-failed', (data) {
      onCallFailed?.call(data['reason']);
    });

    socket!.on('call-end', (_) {
      onCallEnd?.call();
    });

    socket!.connect();
  }

  Future<void> _startCall() async {
    try {
      _peerConnection = await _createPeerConnection();
      
      localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {
          'facingMode': 'user',
        },
      });

      localRenderer.srcObject = localStream;

      localStream!.getTracks().forEach((track) {
        _peerConnection!.addTrack(track, localStream!);
      });

      RTCSessionDescription offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      socket!.emit('call-request', {
        'from': selfId,
        'to': targetId,
        'metadata': {'type': 'emergency'}
      });

      socket!.emit('call-offer', {
        'from': selfId,
        'to': targetId,
        'sdp': offer.toMap(),
      });
    } catch (e) {
      log('Error starting call: $e');
      onCallFailed?.call(e.toString());
    }
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    Map<String, dynamic> configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ]
    };

    RTCPeerConnection pc = await createPeerConnection(configuration);

    pc.onIceCandidate = (candidate) {
      socket!.emit('ice-candidate', {
        'from': selfId,
        'to': targetId,
        'candidate': candidate.toMap(),
      });
    };

    pc.onTrack = (event) {
      if (event.streams.isNotEmpty) {
        // Wir weisen den Stream dem remoteRenderer zu, damit Audio abgespielt wird.
        // Da wir im UI keinen RTCVideoView für remote nutzen, wird kein Video angezeigt.
        remoteRenderer.srcObject = event.streams[0];
      }
    };

    return pc;
  }

  void dispose() {
    localStream?.dispose();
    _peerConnection?.close();
    localRenderer.dispose();
    remoteRenderer.dispose();
    socket?.disconnect();
  }
}
