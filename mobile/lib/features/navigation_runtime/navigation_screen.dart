import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/navmate_scaffold.dart';
import '../auth_session/session_store.dart';
import 'navigation_controller.dart';

class NavigationScreen extends ConsumerWidget {
  const NavigationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(sessionStoreProvider);
    final session = state.session;
    final instructions = session?.instructions ?? const [];
    final progress = session == null || session.totalDistanceMeters == 0
        ? 0.0
        : (session.progressEstimate / session.totalDistanceMeters).clamp(0.0, 1.0).toDouble();

    return NavMateScaffold(
      title: 'Navigation',
      actions: [
        IconButton(
          onPressed: () => ref.read(navigationControllerProvider).refreshSession(),
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
      body: session == null
          ? const Center(child: Text('No active navigation session.'))
          : ListView(
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.status == 'arrived'
                              ? 'You have arrived'
                              : session.destinationNodeName ?? 'Active route',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 10),
                        _ConfidencePill(confidence: session.confidence),
                        const SizedBox(height: 18),
                        Text(
                          session.currentInstruction,
                          style: Theme.of(context).textTheme.headlineMedium,
                          semanticsLabel: session.currentInstruction,
                        ),
                        const SizedBox(height: 18),
                        LinearProgressIndicator(
                          value: progress,
                          minHeight: 14,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${session.progressEstimate.toStringAsFixed(0)} of ${session.totalDistanceMeters.toStringAsFixed(0)} meters',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Current route', style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 10),
                        Text(
                          '${session.buildingName} - ${session.floorName}',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Starting from ${session.startNodeName ?? 'selected entrance'}',
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (session.status == 'arrived') ...[
                  FilledButton(
                    onPressed: () =>
                        ref.read(sessionStoreProvider.notifier).setAppState(AppState.selectingDestination),
                    child: const Text('Navigate To Another Place'),
                  ),
                  const SizedBox(height: 12),
                ],
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    _ActionTile(
                      label: 'Repeat instruction',
                      icon: Icons.volume_up_rounded,
                      onTap: () => ref.read(navigationControllerProvider).repeatInstruction(),
                    ),
                    _ActionTile(
                      label: 'Scan QR',
                      icon: Icons.qr_code_scanner_rounded,
                      onTap: () => ref.read(navigationControllerProvider).openQrScanner(),
                    ),
                    _ActionTile(
                      label: 'I am lost',
                      icon: Icons.support_rounded,
                      onTap: () => ref.read(navigationControllerProvider).submitManualRecovery(),
                    ),
                    _ActionTile(
                      label: 'Nearest help desk',
                      icon: Icons.support_agent_rounded,
                      onTap: () => ref.read(navigationControllerProvider).requestHelpDeskRoute(),
                    ),
                    _ActionTile(
                      label: 'Ask assistant',
                      icon: Icons.mic_none_rounded,
                      onTap: () => _showAssistantSheet(context, ref),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text('Upcoming cues', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                ...instructions.take(4).map(
                  (instruction) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(instruction.text, style: Theme.of(context).textTheme.bodyLarge),
                            const SizedBox(height: 8),
                            Text(
                              '${instruction.distanceMeters.toStringAsFixed(0)} meters',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

Future<void> _showAssistantSheet(BuildContext context, WidgetRef ref) async {
  final controller = TextEditingController();

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (sheetContext) {
      return Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          MediaQuery.of(sheetContext).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ask navigation assistant', style: Theme.of(sheetContext).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'Am I near the lift? Repeat slowly. I am lost.',
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: () async {
                await ref.read(navigationControllerProvider).askAssistant(controller.text.trim());
                if (sheetContext.mounted) {
                  Navigator.of(sheetContext).pop();
                }
              },
              child: const Text('Ask Assistant'),
            ),
          ],
        ),
      );
    },
  );
}

class _ConfidencePill extends StatelessWidget {
  const _ConfidencePill({required this.confidence});

  final String confidence;

  @override
  Widget build(BuildContext context) {
    final normalized = confidence.toLowerCase();
    final background = switch (normalized) {
      'high' => const Color(0xFFDDF4E3),
      'medium' => const Color(0xFFFFEBC7),
      _ => const Color(0xFFF8D7D3),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(40),
      ),
      child: Text(
        'Confidence: ${normalized[0].toUpperCase()}${normalized.substring(1)}',
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 210,
      child: Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(24),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 30),
                const SizedBox(height: 16),
                Text(label, style: Theme.of(context).textTheme.titleLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
