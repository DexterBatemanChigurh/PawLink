import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class PetService {
  final Dio _dio;
  final _storage = const FlutterSecureStorage();

  PetService() : _dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));

  Future<Map<String, dynamic>> _getHeaders() async {
    final token = await _storage.read(key: 'accessToken');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<List<dynamic>> getPets({String? species}) async {
    final headers = await _getHeaders();
    final params = <String, dynamic>{};
    if (species != null) params['species'] = species;

    final response = await _dio.get(
      '/pets',
      queryParameters: params,
      options: Options(headers: headers),
    );

    return (response.data['pets'] as List?) ?? [];
  }

  Future<Map<String, dynamic>> getPetById(String id) async {
    final headers = await _getHeaders();
    final response = await _dio.get(
      '/pets/$id',
      options: Options(headers: headers),
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createPet(Map<String, dynamic> data) async {
    final token = await _storage.read(key: 'accessToken');
    final response = await _dio.post(
      '/pets',
      data: data,
      options: Options(headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      }),
    );
    return response.data as Map<String, dynamic>;
  }
}
