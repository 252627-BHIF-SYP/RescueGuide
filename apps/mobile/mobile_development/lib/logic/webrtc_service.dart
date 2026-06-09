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
  final String targetId = 'dispatcher';

  Function(String)? onCallFailed;
  Function()? onCallEnd;

  Future<void> init(String serverUrl) async {
    await localRenderer.initialize();
    await remoteRenderer.initialize();

    await _prepareLocalMedia();

    log('--- WebRTC Service Info ---');
    log('Device ID (Self): $selfId');
    log('Target ID (Other): $targetId');
    log('---------------------------');

    socket = IO.io(serverUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket!.onConnect((_) {
      log('SUCCESS: Connected to signaling server');
      socket!.emit('register', selfId);
      _startCall();
    });

    socket!.onConnectError((data) => log('ERROR: Signaling connection failed: $data'));
    socket!.onDisconnect((_) => log('INFO: Disconnected from signaling server'));

    socket!.on('call-answer', (data) async {
      log('INFO: Received call-answer from ${data['from'] ?? 'unknown'}');
      var answer = RTCSessionDescription(data['sdp']['sdp'], data['sdp']['type']);
      await _peerConnection?.setRemoteDescription(answer);
    });

    socket!.on('ice-candidate', (data) {
      var candidate = RTCIceCandidate(
        data['candidate']['candidate'],
        data['candidate']['sdpMid'],
        data['candidate']['sdpMLineIndex'],
      );
      _peerConnection?.addCandidate(candidate);
    });

    socket!.on('call-failed', (data) {
      log('ERROR: Call failed: ${data['reason']}');
      onCallFailed?.call(data['reason']);
    });

    socket!.on('call-end', (_) {
      log('INFO: Call ended by remote');
      onCallEnd?.call();
    });

    socket!.connect();
  }

  Future<void> _prepareLocalMedia() async {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {
          'facingMode': isFrontCamera ? 'user' : 'environment',
        },
      });
      localRenderer.srcObject = localStream;
    } catch (e) {
      log('ERROR preparing local media: $e');
    }
  }

  void toggleMic() {
    if (localStream != null) {
      isMicOn = !isMicOn;
      localStream!.getAudioTracks().forEach((track) {
        track.enabled = isMicOn;
      });
    }
  }

  void toggleCamera() {
    if (localStream != null) {
      isCameraOn = !isCameraOn;
      localStream!.getVideoTracks().forEach((track) {
        track.enabled = isCameraOn;
      });
    }
  }

  Future<void> switchCamera() async {
    if (localStream != null) {
      isFrontCamera = !isFrontCamera;
      final videoTrack = localStream!.getVideoTracks().first;
      await Helper.switchCamera(videoTrack);
      isTorchOn = false;
      log('INFO: Switched to ${isFrontCamera ? 'Front' : 'Back'} Camera');
    }
  }

  Future<void> toggleTorch() async {
    if (localStream != null && !isFrontCamera) {
      try {
        isTorchOn = !isTorchOn;
        final videoTrack = localStream!.getVideoTracks().first;
        await videoTrack.setTorch(isTorchOn);
      } catch (e) {
        log('ERROR toggling torch: $e');
      }
    }
  }

  Future<void> _startCall() async {
    try {
      if (_peerConnection != null) return;
      _peerConnection = await _createPeerConnection();
      if (localStream != null) {
        localStream!.getTracks().forEach((track) {
          _peerConnection!.addTrack(track, localStream!);
        });
      }
      RTCSessionDescription offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);
      
      log('INFO: Sending call-offer to $targetId');
      socket!.emit('call-request', {'from': selfId, 'to': targetId});
      socket!.emit('call-offer', {'from': selfId, 'to': targetId, 'sdp': offer.toMap()});
    } catch (e) {
      log('ERROR starting call: $e');
      onCallFailed?.call(e.toString());
    }
  }

  Future<RTCPeerConnection> _createPeerConnection() async {
    RTCPeerConnection pc = await createPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
    pc.onIceCandidate = (candidate) {
      socket!.emit('ice-candidate', {'from': selfId, 'to': targetId, 'candidate': candidate.toMap()});
    };
    pc.onTrack = (event) {
      if (event.streams.isNotEmpty) remoteRenderer.srcObject = event.streams[0];
    };
    return pc;
  }

  void dispose() {
    log('INFO: Disposing WebRTC Service');
    localStream?.getTracks().forEach((track) => track.stop());
    localStream?.dispose();
    _peerConnection?.close();
    localRenderer.dispose();
    remoteRenderer.dispose();
    socket?.disconnect();
  }
}
