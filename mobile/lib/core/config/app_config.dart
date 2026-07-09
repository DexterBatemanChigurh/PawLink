class AppConfig {
  static const String appName = 'PawLink';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api/v1',
  );
  static const String appVersion = '1.0.0';
}
