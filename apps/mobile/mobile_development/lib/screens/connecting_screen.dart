import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../logic/webrtc_service.dart';
import '../logic/settings_service.dart';

class ConnectingScreen extends StatefulWidget {
  const ConnectingScreen({super.key});

  @override
  State<ConnectingScreen> createState() => _ConnectingScreenState();
}

class _ConnectingScreenState extends State<ConnectingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late WebRTCService _webRTCService;

  bool _isCallAccepted = false;
  bool _allowExit = false;
  int _seconds = 0;
  Timer? _timer;

  String _currentAddress = "Suche Standort...";
  /// Noch offene Schritte in der Reihenfolge der Leitstelle (erster = aktueller Schritt)
  List<Map<String, dynamic>> _pendingItems = [];

  /// Erledigte Schritte (uid + Abschlusszeitpunkt) – werden nie wieder angezeigt
  final List<Map<String, String>> _completedItems = [];
  final Set<String> _completedUids = {};

  Map<String, dynamic>? get _currentItem =>
      _pendingItems.isEmpty ? null : _pendingItems.first;

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
      // Bereits übergebene Schritte von der Leitstelle abholen
      _webRTCService.requestInstructionSync();
    };

    _webRTCService.onCallFailed = (reason) {
      if (!mounted) return;
      _showErrorAndExit(reason);
    };

    _webRTCService.onCallEnd = () {
      if (!mounted) return;
      _exitCall('Notruf wurde beendet');
    };
    _webRTCService.onInstructionQueueReceived = _receiveInstructionQueue;
    _webRTCService.onInstructionNextRequested = () {
      if (!mounted) return;
      _completeCurrentInstruction();
    };

    final settings = await SettingsService.init();
    if (!mounted) return;
    await _webRTCService.init(settings.serverUrl.trim());
  }

  /// Die Leitstelle schickt bei jeder Änderung (hinzufügen, umsortieren,
  /// entfernen) den kompletten Stand der offenen Schritte.
  void _receiveInstructionQueue(List<Map<String, dynamic>> items) {
    if (!mounted) return;
    final pending = items
        .where((item) => (item['uid'] ?? '').toString().isNotEmpty)
        .where((item) => (item['name'] ?? '').toString().trim().isNotEmpty)
        // bereits erledigte Schritte bleiben erledigt (z. B. bei Überschneidungen)
        .where((item) => !_completedUids.contains(item['uid'].toString()))
        .toList();

    setState(() => _pendingItems = pending);
    _sendInstructionProgress();
  }

  void _sendInstructionProgress() {
    _webRTCService.sendInstructionProgress({
      'currentUid': _currentItem?['uid'],
      'currentTitle': (_currentItem?['name'] ?? '').toString(),
      'remaining': _pendingItems.length,
      'completedCount': _completedItems.length,
      'totalSteps': _completedItems.length + _pendingItems.length,
      'complete': _pendingItems.isEmpty && _completedItems.isNotEmpty,
      'completed': _completedItems,
    });
  }

  /// „Weiter“: aktueller Schritt ist erledigt und wird in der Leitstelle eingefroren.
  void _completeCurrentInstruction() {
    final current = _currentItem;
    if (current == null) return;
    final uid = current['uid'].toString();

    setState(() {
      _completedUids.add(uid);
      _completedItems.add({
        'uid': uid,
        'completedAt': DateTime.now().toUtc().toIso8601String(),
      });
      _pendingItems = _pendingItems.sublist(1);
    });
    _sendInstructionProgress();
  }

  String get _remainingLabel {
    final remaining = _pendingItems.length;
    if (remaining <= 1) return 'Letzter Schritt';
    return '$remaining verbleibend';
  }

  Future<void> _determinePosition() async {
    bool serviceEnabled;
    LocationPermission permission;

    try {
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted)
          setState(() => _currentAddress = "Standortdienst deaktiviert");
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted)
            setState(() => _currentAddress = "Standortberechtigung verweigert");
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted)
          setState(
            () => _currentAddress = "Standortberechtigung dauerhaft verweigert",
          );
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final coordinatesAddress =
          'Koordinaten: ${position.latitude.toStringAsFixed(5)}, ${position.longitude.toStringAsFixed(5)}';
      if (mounted) setState(() => _currentAddress = coordinatesAddress);
      _webRTCService.setLocation(
        position.latitude,
        position.longitude,
        coordinatesAddress,
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
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        if (!mounted) return;
        setState(() {
          _currentAddress =
              "${place.street}, ${place.postalCode} ${place.locality}";
        });

        _webRTCService.setLocation(
          position.latitude,
          position.longitude,
          _currentAddress,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _currentAddress =
              "Koordinaten: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}";
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
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text('Fehler: $reason')));
    setState(() => _allowExit = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Navigator.of(
          context,
          rootNavigator: true,
        ).popUntil((route) => route.isFirst);
      }
    });
  }

  void _exitCall(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.blueGrey),
    );
    setState(() => _allowExit = true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Navigator.of(
          context,
          rootNavigator: true,
        ).popUntil((route) => route.isFirst);
      }
    });
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
    return PopScope<void>(
      canPop: !_isCallAccepted || _allowExit,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: _isCallAccepted ? _buildEmergencyUI() : _buildConnectingUI(),
      ),
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
            style: TextStyle(
              fontSize: 18,
              color: Colors.blueGrey,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const Text(
            'Bitte bleiben Sie ruhig.',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
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
          Expanded(
            child: _currentItem == null
                ? Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildVideoPreview(),
                  )
                : _buildInstructionWorkspace(),
          ),
          const SizedBox(height: 14),
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
                  style: const TextStyle(
                    color: Colors.black54,
                    fontWeight: FontWeight.w500,
                  ),
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
    return Container(
      width: double.infinity,
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
    );
  }

  Widget _buildInstructionWorkspace() {
    final item = _currentItem!;
    final imageUrl = (item['imageUrl'] ?? '').toString();
    final planName = (item['planName'] ?? '').toString();
    final description = (item['description'] ?? '').toString();
    final isLastStep = _pendingItems.length == 1;
    final total = _completedItems.length + _pendingItems.length;
    final progress = total == 0 ? 0.0 : _completedItems.length / total;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFFF3F7F4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDCE7DF)),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(18, 174, 18, 22),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    (item['name'] ?? '').toString(),
                    style: const TextStyle(
                      fontSize: 24,
                      height: 1.15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF17221C),
                    ),
                  ),
                  if (planName.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      planName,
                      style: const TextStyle(color: Colors.black54),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (description.isNotEmpty)
                    Text(
                      description,
                      style: const TextStyle(fontSize: 17, height: 1.45),
                    ),
                  if (imageUrl.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.network(
                        imageUrl,
                        width: double.infinity,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) =>
                            const SizedBox.shrink(),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Align(
                    alignment: Alignment.centerRight,
                    child: FilledButton.icon(
                      onPressed: _completeCurrentInstruction,
                      icon: Icon(
                        isLastStep ? Icons.done_all : Icons.arrow_forward,
                      ),
                      label: Text(isLastStep ? 'Erledigt' : 'Weiter'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 14,
            left: 16,
            right: 142,
            child: Text(
              planName.isNotEmpty ? planName : 'Erste-Hilfe-Anleitung',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF17221C),
              ),
            ),
          ),
          Positioned(
            top: 14,
            right: 14,
            width: 116,
            height: 148,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: _buildVideoPreview(),
            ),
          ),
          // Fortschritt: zählt die verbleibenden Schritte herunter
          Positioned(
            top: 82,
            left: 16,
            right: 142,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LinearProgressIndicator(
                  value: progress,
                  minHeight: 5,
                  color: const Color(0xFF16805D),
                  backgroundColor: const Color(0xFFDCE7DF),
                ),
                const SizedBox(height: 10),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 250),
                  transitionBuilder: (child, animation) => FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.4),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  ),
                  child: Container(
                    key: ValueKey(_pendingItems.length),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDDF1E6),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          isLastStep ? Icons.flag : Icons.hourglass_bottom,
                          size: 16,
                          color: const Color(0xFF16704F),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _remainingLabel,
                          style: const TextStyle(
                            color: Color(0xFF16704F),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
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
            icon: _webRTCService.isTorchOn
                ? Icons.flashlight_on
                : Icons.flashlight_off,
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
            icon: _webRTCService.isCameraOn
                ? Icons.videocam
                : Icons.videocam_off,
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

  Widget _circleButton({
    required IconData icon,
    required bool active,
    required VoidCallback onPressed,
    bool enabled = true,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: enabled
            ? (active ? Colors.red.shade100 : Colors.grey.shade100)
            : Colors.grey.shade300,
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(
          icon,
          color: enabled ? (active ? Colors.red : Colors.black87) : Colors.grey,
        ),
        onPressed: enabled ? onPressed : null,
        iconSize: 28,
        padding: const EdgeInsets.all(12),
      ),
    );
  }
}
