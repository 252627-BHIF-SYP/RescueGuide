import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../logic/webrtc_service.dart';

class ConnectingScreen extends StatefulWidget {
  const ConnectingScreen({super.key});

  @override
  State<ConnectingScreen> createState() => _ConnectingScreenState();
}

class _ConnectingScreenState extends State<ConnectingScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late WebRTCService _webRTCService;
  
  bool _isCallAccepted = false;
  int _seconds = 0;
  Timer? _timer;

  String _currentAddress = "Suche Standort...";

  @override
  void initState() {
    super.initState();
    _webRTCService = WebRTCService();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();

    _initCall();
    _determinePosition();
  }

  Future<void> _initCall() async {
    _webRTCService.onCallAccepted = () {
      if (!mounted) return;
      if (_isCallAccepted) return;

      setState(() {
        _isCallAccepted = true;
      });
      _startTimer();
    };

    _webRTCService.onCallFailed = (reason) {
      if (!mounted) return;
      _showErrorAndExit(reason);
    };

    _webRTCService.onCallEnd = () {
      if (!mounted) return;
      _exitCall('Notruf wurde beendet');
    };

    await _webRTCService.init('http://192.168.6.10:3000');
  }

  Future<void> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) setState(() => _currentAddress = "Standortdienst deaktiviert");
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) setState(() => _currentAddress = "Standortberechtigung verweigert");
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _currentAddress = "Standortberechtigung dauerhaft verweigert");
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high
      );
      
      _getAddressFromLatLng(position);
    } catch (e) {
      if (mounted) setState(() => _currentAddress = "Standortfehler");
    }
  }

  Future<void> _getAddressFromLatLng(Position position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        if (!mounted) return;
        setState(() {
          _currentAddress = "${place.street}, ${place.postalCode} ${place.locality}";
        });
        
        // Standort an den Service übergeben
        _webRTCService.setLocation(
          position.latitude, 
          position.longitude, 
          _currentAddress
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _currentAddress = "Koordinaten: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}";
        });
      }
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _seconds++;
        });
      }
    });
  }

  void _showErrorAndExit(String reason) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Fehler: $reason')),
    );
    Navigator.of(context, rootNavigator: true).popUntil((route) => route.isFirst);
  }

  void _exitCall(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.blueGrey),
    );
    Navigator.of(context, rootNavigator: true).popUntil((route) => route.isFirst);
  }

  @override
  void dispose() {
    _animationController.dispose();
    _timer?.cancel();
    _webRTCService.dispose();
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
      body: _isCallAccepted ? _buildEmergencyUI() : _buildConnectingUI(),
    );
  }

  // --- UI für das Warten ---
  Widget _buildConnectingUI() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          RotationTransition(
            turns: _animationController,
            child: const Icon(Icons.sync, size: 80, color: Colors.red),
          ),
          const SizedBox(height: 30),
          const Text(
            'Verbindung zur Leitstelle wird aufgebaut…',
            style: TextStyle(fontSize: 18, color: Colors.blueGrey, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const Text('Bitte bleiben Sie ruhig.', style: TextStyle(fontSize: 16, color: Colors.grey)),
        ],
      ),
    );
  }

  // --- UI für den aktiven Notruf ---
  Widget _buildEmergencyUI() {
    return SafeArea(
      child: Column(
        children: [
          _buildHeader(),
          const SizedBox(height: 10),
          _buildVideoPreview(),
          const SizedBox(height: 30),
          _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
      child: Column(
        children: [
          Text(
            'Notfall aktiv seit: ${_formatTime(_seconds)}',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.location_on, color: Colors.red, size: 18),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  _currentAddress,
                  style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.w500),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVideoPreview() {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(20),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: RTCVideoView(
              _webRTCService.localRenderer,
              mirror: _webRTCService.isFrontCamera,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _circleButton(
            icon: _webRTCService.isTorchOn ? Icons.flashlight_on : Icons.flashlight_off,
            active: _webRTCService.isTorchOn,
            onPressed: () async {
              await _webRTCService.toggleTorch();
              setState(() {});
            },
            enabled: !_webRTCService.isFrontCamera,
          ),
          _circleButton(
            icon: _webRTCService.isMicOn ? Icons.mic : Icons.mic_off,
            active: _webRTCService.isMicOn,
            onPressed: () {
              _webRTCService.toggleMic();
              setState(() {});
            },
          ),
          _circleButton(
            icon: _webRTCService.isCameraOn ? Icons.videocam : Icons.videocam_off,
            active: _webRTCService.isCameraOn,
            onPressed: () {
              _webRTCService.toggleCamera();
              setState(() {});
            },
          ),
          _circleButton(
            icon: Icons.flip_camera_ios_outlined,
            active: false,
            onPressed: () async {
              await _webRTCService.switchCamera();
              setState(() {});
            },
          ),
        ],
      ),
    );
  }

  Widget _circleButton({required IconData icon, required bool active, required VoidCallback onPressed, bool enabled = true}) {
    return Container(
      decoration: BoxDecoration(
        color: enabled ? (active ? Colors.red.shade100 : Colors.grey.shade100) : Colors.grey.shade300,
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon, color: enabled ? (active ? Colors.red : Colors.black87) : Colors.grey),
        onPressed: enabled ? onPressed : null,
        iconSize: 28,
        padding: const EdgeInsets.all(12),
      ),
    );
  }
}
