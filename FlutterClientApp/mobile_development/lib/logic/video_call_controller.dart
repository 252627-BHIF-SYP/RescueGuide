import 'package:flutter/material.dart';

class VideoCallController extends ChangeNotifier {
  bool isMuted = false;
  bool isFlashOn = false;
  bool isFrontCamera = true;

  void toggleMute() {
    isMuted = !isMuted;
    notifyListeners();
  }

  void toggleFlash() {
    isFlashOn = !isFlashOn;
    notifyListeners();
  }

  void toggleCamera() {
    isFrontCamera = !isFrontCamera;
    notifyListeners();
  }
}