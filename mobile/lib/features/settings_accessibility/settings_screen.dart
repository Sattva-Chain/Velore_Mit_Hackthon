import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/navmate_scaffold.dart';
import 'accessibility_controller.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(accessibilityControllerProvider);
    final controller = ref.read(accessibilityControllerProvider.notifier);

    return NavMateScaffold(
      title: 'Accessibility',
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('High contrast'),
            value: state.highContrast,
            onChanged: controller.toggleHighContrast,
          ),
          SwitchListTile(
            title: const Text('Larger text'),
            value: state.largeText,
            onChanged: controller.toggleLargeText,
          ),
          SwitchListTile(
            title: const Text('Vibration feedback'),
            value: state.vibrationEnabled,
            onChanged: controller.toggleVibration,
          ),
          SwitchListTile(
            title: const Text('Accessible routes only'),
            value: state.accessibleOnly,
            onChanged: controller.toggleAccessibleOnly,
          ),
        ],
      ),
    );
  }
}
