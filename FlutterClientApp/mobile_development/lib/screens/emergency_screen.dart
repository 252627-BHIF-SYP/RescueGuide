import 'package:flutter/material.dart';
import '../logic/video_call_controller.dart';
import '../widgets/camera_preview_widget.dart';
import '../widgets/call_action_bar.dart';

class EmergencyScreen extends StatefulWidget {
  const EmergencyScreen({super.key});

  @override
  State<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends State<EmergencyScreen> {
  final VideoCallController _controller = VideoCallController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Der Hauptinhalt (Textfeld & Kamera)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  const SizedBox(height: 30),

                  // Textfeld-Mockup für Anweisungen
                  _buildInstructionField(),

                  const SizedBox(height: 30),

                  // Der kleinere Kamera-Kasten
                  const CameraPreviewWidget(),
                ],
              ),
            ),

            // "LIVE" Anzeige oben links
            Positioned(
              top: 20,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(6)),
                child: const Text("LIVE", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ),

            // Die Action-Bar am unteren Rand
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: CallActionBar(
                isMuted: _controller.isMuted,
                isFlashOn: _controller.isFlashOn,
                onMute: _controller.toggleMute,
                onFlash: _controller.toggleFlash,
                onFlip: _controller.toggleCamera,
                onHangUp: () => Navigator.of(context).pushReplacementNamed('/'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Hilfsmethode für das Textfeld-Mockup
  Widget _buildInstructionField() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A), // Sehr dunkles Grau
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.red.withOpacity(0.3), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            "ANWEISUNGEN DER LEITSTELLE",
            style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 12),
          ),
          SizedBox(height: 10),
          Text(
            "Bitte bewahren Sie Ruhe. Der Rettungsdienst ist unterwegs. Sichern Sie die Unfallstelle und leisten Sie Erste Hilfe, wenn möglich.",
            style: TextStyle(color: Colors.white, fontSize: 16, height: 1.4),
          ),
        ],
      ),
    );
  }
}