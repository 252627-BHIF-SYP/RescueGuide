import 'package:flutter/material.dart';
import 'package:persistent_bottom_nav_bar/persistent_bottom_nav_bar.dart';
import '../logic/panic_controller.dart';
import '../widgets/emergency_icon.dart';
import 'connecting_screen.dart';

class PanicScreen extends StatefulWidget {
  const PanicScreen({super.key});

  @override
  State<PanicScreen> createState() => _PanicScreenState();
}

class _PanicScreenState extends State<PanicScreen> {
  final PanicController _controller = PanicController();

  @override
  void initState() {
    super.initState();
    _controller.addListener(() => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: RadialGradient(colors: [Colors.white, Color(0xFFF4F4F4)]),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: Column(
                  children: const [
                    Text('RESCUE GUIDE', style: TextStyle(color: Color(0xFFd32f2f), fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: 2)),
                    Text('Notfall-Assistent', style: TextStyle(color: Colors.grey, letterSpacing: 1)),
                  ],
                ),
              ),
              GestureDetector(
                onTapDown: (_) => _controller.startHold(() {
                  // Wir nutzen den speziellen Navigator des Pakets, um die Navbar auszublenden
                  PersistentNavBarNavigator.pushNewScreen(
                    context,
                    screen: const ConnectingScreen(),
                    withNavBar: false, // NAVBAR AUSBLENDEN
                    pageTransitionAnimation: PageTransitionAnimation.fade,
                  );
                }),
                onTapUp: (_) => _controller.stopHold(),
                onTapCancel: () => _controller.stopHold(),
                child: EmergencyIcon(
                  isHolding: _controller.isHolding,
                  progress: _controller.progress,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 60),
                child: Column(
                  children: const [
                    Text('2 Sekunden halten', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                    Text('um den Notfall zu starten', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}