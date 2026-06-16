import 'package:shared_preferences/shared_preferences.dart';

class SettingsService {
  static const String _keyServerUrl = 'server_url';
  static const String _keyUserName = 'user_name';
  static const String _keyUserPhone = 'user_phone';
  static const String _keyBloodType = 'blood_type';
  static const String _keyAllergies = 'allergies';

  static const String defaultServerUrl = 'http://192.168.6.10:3000';

  final SharedPreferences _prefs;

  SettingsService(this._prefs);

  static Future<SettingsService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return SettingsService(prefs);
  }

  String get serverUrl => _prefs.getString(_keyServerUrl) ?? defaultServerUrl;
  set serverUrl(String value) => _prefs.setString(_keyServerUrl, value);

  String get userName => _prefs.getString(_keyUserName) ?? '';
  set userName(String value) => _prefs.setString(_keyUserName, value);

  String get userPhone => _prefs.getString(_keyUserPhone) ?? '';
  set userPhone(String value) => _prefs.setString(_keyUserPhone, value);

  String get bloodType => _prefs.getString(_keyBloodType) ?? 'Unbekannt';
  set bloodType(String value) => _prefs.setString(_keyBloodType, value);

  String get allergies => _prefs.getString(_keyAllergies) ?? '';
  set allergies(String value) => _prefs.setString(_keyAllergies, value);
}
