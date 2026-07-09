import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class MatchService {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();

  MatchService() : _dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));

  Future<Map<String, dynamic>> _getHeaders() async {
    final token = await _storage.read(key: 'accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<Map<String, dynamic>> expressInterest(String petId, {String? message, String? phone}) async {
    final headers = await _getHeaders();
    final response = await _dio.post(
      '/matches/pets/$petId',
      data: {
        if (message != null) 'message': message,
        if (phone != null) 'phone': phone,
      },
      options: Options(headers: headers),
    );
    return response.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getMyRequests() async {
    final headers = await _getHeaders();
    final response = await _dio.get(
      '/matches/my',
      options: Options(headers: headers),
    );
    return response.data as List<dynamic>;
  }

  Future<List<dynamic>> getReceivedRequests() async {
    final headers = await _getHeaders();
    final response = await _dio.get(
      '/matches/received',
      options: Options(headers: headers),
    );
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> updateStatus(String matchId, String status) async {
    final headers = await _getHeaders();
    final response = await _dio.post(
      '/matches/$matchId/status',
      data: {'status': status},
      options: Options(headers: headers),
    );
    return response.data as Map<String, dynamic>;
  }
}
