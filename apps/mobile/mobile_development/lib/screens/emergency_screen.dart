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

  @override
  void initState() {
    super.initState();
    _initWebRTC();
  }

  Future<void> _initWebRTC() async {
    // Ersetze 'http://10.0.2.2:3000' durch die tatsächliche IP deines Servers
    // 10.0.2.2 ist der Localhost des Hosts für den Android Emulator.
    await _webRTCService.init('http://10.0.2.2:3000');
    if (mounted) {
      setState(() {
        _isConnecting = false;
      });
    }
  }

  @override
  void dispose() {
    _webRTCService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Eigene Kamera (Vollbild)
          Center(
            child: RTCVideoView(
              _webRTCService.localRenderer,
              mirror: true,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
          ),
          
          // Aufhellungseffekt für bessere Lesbarkeit der UI im White Mode
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Colors.white.withOpacity(0.7),
                  Colors.transparent,
                  Colors.transparent,
                  Colors.white.withOpacity(0.7),
                ],
                stops: const [0.0, 0.15, 0.85, 1.0],
              ),
            ),
          ),

          // Overlay UI
          SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.red.shade700,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: const Text(
                      'LIVE-NOTFALL-ÜBERTRAGUNG',
                      style: TextStyle(
                        color: Colors.white, 
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ),
                
                // Status-Anzeige
                if (!_isConnecting)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.record_voice_over, color: Colors.green, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Verbindung zur Leitstelle aktiv',
                          style: TextStyle(
                            color: Colors.grey.shade800, 
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),

                if (_isConnecting)
                  const Center(child: CircularProgressIndicator(color: Colors.red)),

                Padding(
                  padding: const EdgeInsets.only(bottom: 40),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildActionButton(
                        icon: Icons.mic,
                        onPressed: () {}, // TODO
                        color: Colors.black87,
                      ),
                      _buildHangupButton(context),
                      _buildActionButton(
                        icon: Icons.switch_camera,
                        onPressed: () {}, // TODO
                        color: Colors.black87,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required VoidCallback onPressed, required Color color}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(icon, color: color),
        onPressed: onPressed,
        iconSize: 28,
        padding: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildHangupButton(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.red,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.red.withOpacity(0.3),
            blurRadius: 15,
            spreadRadius: 2,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: IconButton(
        icon: const Icon(Icons.call_end, color: Colors.white),
        onPressed: () {
          _webRTCService.socket?.emit('call-end', {
            'from': _webRTCService.selfId,
            'to': _webRTCService.targetId,
            'reason': 'user-ended'
          });
          Navigator.pushReplacementNamed(context, '/');
        },
        iconSize: 32,
        padding: const EdgeInsets.all(20),
      ),
    );
  }
}
