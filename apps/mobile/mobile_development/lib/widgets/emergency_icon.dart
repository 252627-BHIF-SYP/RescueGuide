import 'package:flutter/material.dart';

class EmergencyIcon extends StatelessWidget {
  final bool isHolding;
  final double progress;

  const EmergencyIcon({super.key, required this.isHolding, required this.progress});

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        SizedBox(
          width: 250,
          height: 250,
          child: CircularProgressIndicator(
            value: progress / 100,
            strokeWidth: 12,
            backgroundColor: Colors.grey[200],
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFd32f2f)),
          ),
        ),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 180,
          height: 180,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isHolding ? const Color(0xFF0046ad) : const Color(0xFFf5f5f5),
            boxShadow: isHolding
                ? [BoxShadow(color: Colors.blue.withOpacity(0.6), blurRadius: 30, spreadRadius: 10)]
                : [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))],
          ),
          child: Icon(
            Icons.notifications_active,
            size: 80,
            color: isHolding ? Colors.white : Colors.grey[400],
          ),
        ),
      ],
    );
  }
}