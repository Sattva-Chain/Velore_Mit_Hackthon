import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/navigation_models.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio(
    BaseOptions(
      baseUrl: 'http://127.0.0.1:8080/api/v1',
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ),
  );
});

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(dioProvider));
});

class ApiClient {
  ApiClient(this._dio);

  final Dio _dio;

  Future<NavigationSessionDto> startNavigation({
    String? startNodeId,
    String? qrCodeValue,
    String? deviceId,
  }) async {
    final response = await _dio.post(
      '/navigation/start',
      data: {
        if (startNodeId != null) 'startNodeId': startNodeId,
        if (qrCodeValue != null) 'qrCodeValue': qrCodeValue,
        if (deviceId != null) 'deviceId': deviceId,
      },
    );
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<DestinationDto>> destinations(String buildingId) async {
    final response = await _dio.get('/buildings/$buildingId/destinations');
    return (response.data as List<dynamic>)
        .map((item) => DestinationDto.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<NavigationSessionDto> setDestination({
    required String sessionId,
    String? destinationNodeId,
    String? destinationText,
  }) async {
    final response = await _dio.post(
      '/navigation/$sessionId/destination',
      data: {
        if (destinationNodeId != null) 'destinationNodeId': destinationNodeId,
        if (destinationText != null) 'destinationText': destinationText,
      },
    );
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<NavigationSessionDto> progress({
    required String sessionId,
    required double estimatedDeltaMeters,
    String? confidenceHint,
    bool? forceRecovery,
  }) async {
    final response = await _dio.post(
      '/navigation/$sessionId/progress',
      data: {
        'estimatedDeltaMeters': estimatedDeltaMeters,
        if (confidenceHint != null) 'confidenceHint': confidenceHint,
        if (forceRecovery != null) 'forceRecovery': forceRecovery,
      },
    );
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<NavigationSessionDto> reanchor({
    required String sessionId,
    required String qrCodeValue,
  }) async {
    final response = await _dio.post(
      '/navigation/$sessionId/anchor',
      data: {'qrCodeValue': qrCodeValue},
    );
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<NavigationSessionDto> recover({
    required String sessionId,
    String? reason,
    String? action,
  }) async {
    final response = await _dio.post(
      '/navigation/$sessionId/recovery',
      data: {
        if (reason != null) 'reason': reason,
        if (action != null) 'action': action,
      },
    );
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<NavigationSessionDto> getSession(String sessionId) async {
    final response = await _dio.get('/navigation/$sessionId');
    return NavigationSessionDto.fromJson(response.data as Map<String, dynamic>);
  }

  Future<AssistantReplyDto> assistant({
    required String sessionId,
    required String query,
  }) async {
    final response = await _dio.post(
      '/navigation/$sessionId/assistant',
      data: {'query': query},
    );
    return AssistantReplyDto.fromJson(response.data as Map<String, dynamic>);
  }
}
