import 'package:flutter/material.dart';
import '../logic/settings_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  SettingsService? _settingsService;
  bool _isLoading = true;

  final _serverController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _allergiesController = TextEditingController();
  String _selectedBloodType = 'Unbekannt';

  final List<String> _bloodTypes = ['Unbekannt', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final service = await SettingsService.init();
    setState(() {
      _settingsService = service;
      _serverController.text = service.serverUrl;
      _nameController.text = service.userName;
      _phoneController.text = service.userPhone;
      _allergiesController.text = service.allergies;
      _selectedBloodType = service.bloodType;
      _isLoading = false;
    });
  }

  void _saveSettings() {
    if (_settingsService != null) {
      _settingsService!.serverUrl = _serverController.text;
      _settingsService!.userName = _nameController.text;
      _settingsService!.userPhone = _phoneController.text;
      _settingsService!.allergies = _allergiesController.text;
      _settingsService!.bloodType = _selectedBloodType;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Einstellungen gespeichert'), backgroundColor: Colors.green),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Einstellungen', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.save, color: Colors.blue),
            onPressed: _saveSettings,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Profil & Notfall-Info'),
            _buildCard([
              _buildTextField(_nameController, 'Vollständiger Name', Icons.person),
              _buildTextField(_phoneController, 'Telefonnummer', Icons.phone),
              const Divider(),
              _buildDropdown('Blutgruppe', Icons.bloodtype),
              _buildTextField(_allergiesController, 'Allergien / Vorerkrankungen', Icons.medical_services, maxLines: 3),
            ]),
            const SizedBox(height: 24),
            _buildSectionHeader('System-Konfiguration'),
            _buildCard([
              _buildTextField(_serverController, 'Signaling Server URL', Icons.dns, 
                hint: 'http://192.168.x.x:3000'),
            ]),
            const SizedBox(height: 32),
            Center(
              child: Text(
                'Rescue Guide v1.0.0',
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1),
      ),
    );
  }

  Widget _buildCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {int maxLines = 1, String? hint}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          icon: Icon(icon, color: Colors.grey.shade400),
          labelText: label,
          hintText: hint,
          border: InputBorder.none,
          labelStyle: const TextStyle(fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildDropdown(String label, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey.shade400),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                DropdownButton<String>(
                  value: _selectedBloodType,
                  isExpanded: true,
                  underline: Container(),
                  items: _bloodTypes.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
                  onChanged: (val) => setState(() => _selectedBloodType = val!),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
