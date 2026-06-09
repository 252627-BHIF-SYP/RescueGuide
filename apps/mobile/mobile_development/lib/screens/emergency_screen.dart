import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../logic/webrtc_service.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  final WebRTCService _webRTCService = WebRTCService();
  bool _isConnecting = true;
  int _seconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _initWebRTC();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _seconds++;
        });
      }
    });
  }

  Future<void> _initWebRTC() async {
    await _webRTCService.init('http://10.0.2.2:3000');
    if (mounted) {
      setState(() {
        _isConnecting = false;
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _webRTCService.dispose();
    super.dispose();
  }

  String _formatTime(int seconds) {
    int mins = seconds ~/ 60;
    int secs = seconds % 60;
    return "$mins:${secs.toString().padLeft(2, '0')}";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Header Info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
              child: Column(
                children: [
                  Text(
                    'Notfall aktiv seit: ${_formatTime(_seconds)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.location_on, color: Colors.red, size: 18),
                      SizedBox(width: 4),
                      Text(
                        'Musterstraße 12, 12345 Stadt',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(Icons.timer_outlined, color: Colors.green, size: 18),
                      SizedBox(width: 4),
                      Text(
                        'Eintreffen der Einsatzkräfte',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.black54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Kamera-Kasten
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      children: [
                        if (!_isConnecting)
                          RTCVideoView(
                            _webRTCService.localRenderer,
                            mirror: _webRTCService.isFrontCamera,
                            objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                          ),
                        if (_isConnecting)
                          const Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                CircularProgressIndicator(color: Colors.red),
                                SizedBox(height: 16),
                                Text(
                                  'Kamera wird gestartet...',
                                  style: TextStyle(color: Colors.black54),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 30),

            // Bottom Actions
            Padding(
              padding: const EdgeInsets.only(bottom: 40),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildActionButton(
                    icon: _webRTCService.isTorchOn ? Icons.flashlight_on : Icons.flashlight_off,
                    isActive: _webRTCService.isTorchOn,
                    onPressed: () async {
                      await _webRTCService.toggleTorch();
                      setState(() {});
                    },
                    enabled: !_webRTCService.isFrontCamera,
                  ),
                  _buildActionButton(
                    icon: _webRTCService.isMicOn ? Icons.mic : Icons.mic_off,
                    isActive: _webRTCService.isMicOn,
                    onPressed: () {
                      _webRTCService.toggleMic();
                      setState(() {});
                    },
                  ),
                  _buildActionButton(
                    icon: _webRTCService.isCameraOn ? Icons.videocam : Icons.videocam_off,
                    isActive: _webRTCService.isCameraOn,
                    onPressed: () {
                      _webRTCService.toggleCamera();
                      setState(() {});
                    },
                  ),
                  _buildActionButton(
                    icon: Icons.flip_camera_ios_outlined,
                    isActive: false,
                    onPressed: () async {
                      await _webRTCService.switchCamera();
                      setState(() {});
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required VoidCallback onPressed,
    required bool isActive,
    bool enabled = true,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: enabled 
          ? (isActive ? Colors.red.shade100 : Colors.grey.shade100)
          : Colors.grey.shade300,
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon, color: enabled ? (isActive ? Colors.red : Colors.black87) : Colors.grey),
        onPressed: enabled ? onPressed : null,
        iconSize: 28,
        padding: const EdgeInsets.all(12),
      ),
    );
  }
}
