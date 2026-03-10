import 'dart:async';
import 'package:flutter/material.dart';

class PanicController extends ChangeNotifier {
  double progress = 0.0;
  bool isHolding = false;
  Timer? _timer;

  void startHold(VoidCallback onComplete) {
    isHolding = true;
    progress = 0.0;
    notifyListeners();

    _timer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (progress < 100) {
        progress += 2.5;
        notifyListeners();
      } else {
        timer.cancel();
        onComplete();
      }
    });
  }

  void stopHold() {
    isHolding = false;
    progress = 0.0;
    _timer?.cancel();
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}