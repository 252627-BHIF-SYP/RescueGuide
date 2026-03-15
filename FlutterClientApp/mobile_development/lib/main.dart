import 'package:flutter/material.dart';
import 'screens/main_wrapper.dart';
import 'screens/connecting_screen.dart';
import 'screens/emergency_screen.dart';

void main() {
  runApp(const MeinApp());
}

class MeinApp extends StatelessWidget {
  const MeinApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rescue Guide',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
        useMaterial3: true,
      ),
      home: const MainWrapper(),
      routes: {
        '/connecting': (context) => const ConnectingScreen(),
        '/emergency': (context) => const EmergencyScreen(),
      },
    );
  }
}