import 'package:flutter/material.dart';

class CallActionBar extends StatelessWidget {
  final bool isMuted;
  final bool isFlashOn;
  final VoidCallback onMute;
  final VoidCallback onFlash;
  final VoidCallback onFlip;
  final VoidCallback onHangUp;

  const CallActionBar({
    super.key,
    required this.isMuted,
    required this.isFlashOn,
    required this.onMute,
    required this.onFlash,
    required this.onFlip,
    required this.onHangUp,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 30),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildBtn(isFlashOn ? Icons.flash_on : Icons.flash_off, onFlash, isFlashOn ? Colors.amber : Colors.white),
          _buildBtn(Icons.flip_camera_ios, onFlip, Colors.white),
          _buildBtn(isMuted ? Icons.mic_off : Icons.mic, onMute, isMuted ? Colors.red : Colors.white),
          _buildBtn(Icons.call_end, onHangUp, Colors.white, Colors.red),
        ],
      ),
    );
  }

  Widget _buildBtn(IconData icon, VoidCallback action, Color iconColor, [Color bgColor = Colors.white10]) {
    return CircleAvatar(
      radius: 30,
      backgroundColor: bgColor,
      child: IconButton(
        icon: Icon(icon, color: iconColor, size: 28),
        onPressed: action,
      ),
    );
  }
}