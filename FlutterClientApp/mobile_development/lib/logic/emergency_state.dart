import 'dart:async';
import 'package:flutter/material.dart';

enum EmergencyStatus { idle, holding, connecting, connected }

class EmergencyController extends ChangeNotifier {
  EmergencyStatus status = EmergencyStatus.idle;
  double holdProgress = 0.0;
  Timer? _timer;

  void startHold(VoidCallback onComplete) {
    status = EmergencyStatus.holding;
    holdProgress = 0.0;
    notifyListeners();

    _timer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      holdProgress += 5;
      if (holdProgress >= 100) {
        _timer?.cancel();
        status = EmergencyStatus.connecting;
        notifyListeners();
        onComplete(); // Navigation Trigger
      }
      notifyListeners();
    });
  }

  void stopHold() {
    _timer?.cancel();
    status = EmergencyStatus.idle;
    holdProgress = 0.0;
    notifyListeners();
  }

  void startConnection(VoidCallback onConnected) {
    // Entspricht deinem Angular Effect + setTimeout
    Timer(const Duration(seconds: 3), () {
      status = EmergencyStatus.connected;
      notifyListeners();
      onConnected();
    });
  }
}