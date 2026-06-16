import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import '../logic/webrtc_service.dart';

class EmergencyScreen extends StatefulWidget {
  final WebRTCService webRTCService;
  const EmergencyScreen({super.key, required this.webRTCService});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  int _seconds = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    _setupCallHandlers();
  }

  void _setupCallHandlers() {
    widget.webRTCService.onCallEnd = () {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notruf wurde von der Leitstelle beendet'),
            backgroundColor: Colors.blueGrey,
          ),
        );
        // Zurück zum Hauptbildschirm (PanicScreen im Wrapper)
        Navigator.of(context, rootNavigator: true).popUntil((route) => route.isFirst);
      }
    };
    
    widget.webRTCService.onCallFailed = (reason) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Verbindung unterbrochen: $reason')),
        );
        Navigator.of(context, rootNavigator: true).popUntil((route) => route.isFirst);
      }
    };
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

  @override
  void dispose() {
    _timer?.cancel();
    widget.webRTCService.dispose();
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
                    child: RTCVideoView(
                      widget.webRTCService.localRenderer,
                      mirror: widget.webRTCService.isFrontCamera,
                      objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
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
                    icon: widget.webRTCService.isTorchOn ? Icons.flashlight_on : Icons.flashlight_off,
                    isActive: widget.webRTCService.isTorchOn,
                    onPressed: () async {
                      await widget.webRTCService.toggleTorch();
                      setState(() {});
                    },
                    enabled: !widget.webRTCService.isFrontCamera,
                  ),
                  _buildActionButton(
                    icon: widget.webRTCService.isMicOn ? Icons.mic : Icons.mic_off,
                    isActive: widget.webRTCService.isMicOn,
                    onPressed: () {
                      widget.webRTCService.toggleMic();
                      setState(() {});
                    },
                  ),
                  _buildActionButton(
                    icon: widget.webRTCService.isCameraOn ? Icons.videocam : Icons.videocam_off,
                    isActive: widget.webRTCService.isCameraOn,
                    onPressed: () {
                      widget.webRTCService.toggleCamera();
                      setState(() {});
                    },
                  ),
                  _buildActionButton(
                    icon: Icons.flip_camera_ios_outlined,
                    isActive: false,
                    onPressed: () async {
                      await widget.webRTCService.switchCamera();
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
