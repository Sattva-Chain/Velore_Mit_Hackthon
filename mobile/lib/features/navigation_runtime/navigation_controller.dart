import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sensors_plus/sensors_plus.dart';

import '../../core/models/navigation_models.dart';
import '../../core/network/api_client.dart';
import '../auth_session/session_store.dart';
import '../settings_accessibility/accessibility_controller.dart';
import 'voice_guidance_service.dart';

final voiceGuidanceProvider = Provider<VoiceGuidanceService>((ref) {
  return VoiceGuidanceService();
});

final navigationControllerProvider = Provider.autoDispose<NavigationController>((ref) {
  final controller = NavigationController(ref);
  ref.onDispose(controller.dispose);
  return controller;
});

class NavigationController {
  NavigationController(this._ref);

  final Ref _ref;
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;

  Future<void> startWithoutQr() async {
    final api = _ref.read(apiClientProvider);
    final session = await api.startNavigation(deviceId: 'navmate-demo-device');
    _ref.read(sessionStoreProvider.notifier).setSession(
      session,
      appState: AppState.selectingEntrance,
    );
    final entrancePrompt = session.entranceOptions.isEmpty
        ? session.voicePrompt
        : 'Where are you starting from? ${session.entranceOptions.map((option) => option.label).join(', ')}.';
    await _ref.read(voiceGuidanceProvider).speak(entrancePrompt);
    HapticFeedback.selectionClick();
  }

  void openQrScanner() {
    _ref.read(sessionStoreProvider.notifier).setAppState(AppState.scanningQr);
  }

  Future<void> startFromQr(String qrCodeValue) async {
    final session = await _ref.read(apiClientProvider).startNavigation(
          qrCodeValue: qrCodeValue,
          deviceId: 'navmate-demo-device',
        );
    _ref.read(sessionStoreProvider.notifier).setSession(
      session,
      appState: AppState.selectingDestination,
      lastQrCodeValue: qrCodeValue,
    );
    await _ref.read(voiceGuidanceProvider).speak(session.voicePrompt);
    HapticFeedback.mediumImpact();
  }

  Future<void> selectEntrance(EntranceOptionDto entrance) async {
    final session = await _ref.read(apiClientProvider).startNavigation(
          startNodeId: entrance.nodeId,
          deviceId: 'navmate-demo-device',
        );
    _ref.read(sessionStoreProvider.notifier).setSession(
      session,
      appState: AppState.selectingDestination,
    );
    await _ref.read(voiceGuidanceProvider).speak(session.voicePrompt);
    HapticFeedback.selectionClick();
  }

  void rememberSpokenText(String value) {
    _ref.read(sessionStoreProvider.notifier).setSpokenText(value);
  }

  Future<void> selectDestination(DestinationDto destination) async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).setDestination(
          sessionId: session.sessionId,
          destinationNodeId: destination.nodeId,
        );
    _ref.read(sessionStoreProvider.notifier).setSession(updated, appState: AppState.navigating);
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
    HapticFeedback.mediumImpact();
    _startImuMonitoring();
  }

  Future<void> selectDestinationByVoice(String spokenText) async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null || spokenText.trim().isEmpty) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).setDestination(
          sessionId: session.sessionId,
          destinationText: spokenText,
        );
    final appState = updated.destinationNodeId == null
        ? AppState.selectingDestination
        : AppState.navigating;
    _ref.read(sessionStoreProvider.notifier).setSession(
      updated,
      appState: appState,
      lastSpokenText: spokenText,
    );
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
    if (updated.destinationNodeId != null) {
      _startImuMonitoring();
    }
  }

  Future<void> refreshSession() async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).getSession(session.sessionId);
    _ref.read(sessionStoreProvider.notifier).setSession(updated);
  }

  Future<void> submitManualRecovery() async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).recover(
          sessionId: session.sessionId,
          reason: 'manual_help_request',
        );
    _ref.read(sessionStoreProvider.notifier).setSession(updated, appState: AppState.recovering);
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
    HapticFeedback.heavyImpact();
  }

  Future<void> repeatInstruction() async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    await _ref.read(voiceGuidanceProvider).speak(session.currentInstruction);
  }

  Future<void> requestHelpDeskRoute() async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).recover(
          sessionId: session.sessionId,
          action: 'nearest_helpdesk',
        );
    _ref.read(sessionStoreProvider.notifier).setSession(updated, appState: AppState.navigating);
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
    _startImuMonitoring();
  }

  Future<void> returnToLastConfirmedPoint() async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      return;
    }
    final updated = await _ref.read(apiClientProvider).recover(
          sessionId: session.sessionId,
          action: 'return_to_anchor',
        );
    _ref.read(sessionStoreProvider.notifier).setSession(updated, appState: AppState.navigating);
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
    _startImuMonitoring();
  }

  Future<void> reanchor(String qrCodeValue) async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null) {
      await startFromQr(qrCodeValue);
      return;
    }
    final updated = await _ref.read(apiClientProvider).reanchor(
          sessionId: session.sessionId,
          qrCodeValue: qrCodeValue,
        );
    _ref.read(sessionStoreProvider.notifier).setSession(
      updated,
      appState: updated.recoveryMode ? AppState.recovering : AppState.navigating,
      lastQrCodeValue: qrCodeValue,
    );
    await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
  }

  Future<AssistantReplyDto?> askAssistant(String query) async {
    final session = _ref.read(sessionStoreProvider).session;
    if (session == null || query.trim().isEmpty) {
      return null;
    }
    final reply = await _ref.read(apiClientProvider).assistant(
          sessionId: session.sessionId,
          query: query,
        );
    await _ref.read(voiceGuidanceProvider).speak(reply.responseText);
    if (reply.rerouteAction != null || reply.recoveryAction != null) {
      await refreshSession();
    }
    return reply;
  }

  void _startImuMonitoring() {
    _accelerometerSubscription?.cancel();
    _accelerometerSubscription = accelerometerEventStream().listen((event) async {
      final magnitude = event.x.abs() + event.y.abs() + event.z.abs();
      if (magnitude < 5) {
        return;
      }
      final session = _ref.read(sessionStoreProvider).session;
      if (session == null || session.status.toLowerCase() == 'recovering') {
        return;
      }
      try {
        final updated = await _ref.read(apiClientProvider).progress(
              sessionId: session.sessionId,
              estimatedDeltaMeters: 2,
              confidenceHint: 'medium',
            );
        final nextState = updated.recoveryMode
            ? AppState.recovering
            : updated.status == 'arrived'
                ? AppState.arrived
                : AppState.navigating;
        _ref.read(sessionStoreProvider.notifier).setSession(updated, appState: nextState);
        if (_ref.read(accessibilityControllerProvider).vibrationEnabled) {
          HapticFeedback.mediumImpact();
        }
        if (updated.voicePrompt != session.voicePrompt) {
          await _ref.read(voiceGuidanceProvider).speak(updated.voicePrompt);
        }
      } catch (_) {
        // TODO: replace with calibrated dead reckoning and rate limiting per device profile.
      }
    });
  }

  void dispose() {
    _accelerometerSubscription?.cancel();
  }
}
