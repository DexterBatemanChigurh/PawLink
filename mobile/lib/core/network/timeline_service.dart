import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class TimelineService {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();

  TimelineService() : _dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));

  Future<Map<String, dynamic>> _getHeaders() async {
    final token = await _storage.read(key: 'accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<List<dynamic>> getTimeline(String petId) async {
    final headers = await _getHeaders();
    final response = await _dio.get(
      '/pets/$petId/timeline',
      options: Options(headers: headers),
    );
    return response.data as List<dynamic>;
  }
}
