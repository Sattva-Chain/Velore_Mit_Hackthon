import 'package:flutter_riverpod/flutter_riverpod.dart';

class AccessibilityState {
  const AccessibilityState({
    this.highContrast = false,
    this.largeText = true,
    this.vibrationEnabled = true,
    this.accessibleOnly = true,
  });

  final bool highContrast;
  final bool largeText;
  final bool vibrationEnabled;
  final bool accessibleOnly;

  AccessibilityState copyWith({
    bool? highContrast,
    bool? largeText,
    bool? vibrationEnabled,
    bool? accessibleOnly,
  }) {
    return AccessibilityState(
      highContrast: highContrast ?? this.highContrast,
      largeText: largeText ?? this.largeText,
      vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
      accessibleOnly: accessibleOnly ?? this.accessibleOnly,
    );
  }
}

class AccessibilityController extends StateNotifier<AccessibilityState> {
  AccessibilityController() : super(const AccessibilityState());

  void toggleHighContrast(bool value) => state = state.copyWith(highContrast: value);
  void toggleLargeText(bool value) => state = state.copyWith(largeText: value);
  void toggleVibration(bool value) => state = state.copyWith(vibrationEnabled: value);
  void toggleAccessibleOnly(bool value) => state = state.copyWith(accessibleOnly: value);
}

final accessibilityControllerProvider =
    StateNotifierProvider<AccessibilityController, AccessibilityState>(
  (ref) => AccessibilityController(),
);
