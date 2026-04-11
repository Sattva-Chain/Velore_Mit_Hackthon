import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/navmate_scaffold.dart';
import '../auth_session/session_store.dart';
import '../navigation_runtime/navigation_controller.dart';

class RecoveryScreen extends ConsumerWidget {
  const RecoveryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionStoreProvider).session;
    final options = session?.recoveryOptions ?? const [];

    return NavMateScaffold(
      title: 'Recovery',
      body: ListView(
        children: [
          Card(
            color: const Color(0xFFFFF4D9),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Let’s recover your position safely.',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    session?.voicePrompt ??
                        'I have less confidence in your exact position. Please continue slowly.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
          ...options.map(
            (option) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _RecoveryAction(
                label: option.label,
                description: option.description,
                onTap: () {
                  switch (option.action) {
                    case 'scan_qr':
                      ref.read(navigationControllerProvider).openQrScanner();
                      break;
                    case 'repeat_last':
                      ref.read(navigationControllerProvider).repeatInstruction();
                      break;
                    case 'nearest_helpdesk':
                      ref.read(navigationControllerProvider).requestHelpDeskRoute();
                      break;
                    case 'return_to_anchor':
                      ref.read(navigationControllerProvider).returnToLastConfirmedPoint();
                      break;
                  }
                },
              ),
            ),
          ),
          FilledButton(
            onPressed: () => ref.read(navigationControllerProvider).repeatInstruction(),
            child: const Text('Repeat Instruction Slowly'),
          ),
        ],
      ),
    );
  }
}

class _RecoveryAction extends StatelessWidget {
  const _RecoveryAction({
    required this.label,
    required this.description,
    required this.onTap,
  });

  final String label;
  final String description;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(description, style: Theme.of(context).textTheme.bodyLarge),
            ],
          ),
        ),
      ),
    );
  }
}
