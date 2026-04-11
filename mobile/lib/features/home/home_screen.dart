import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/widgets/navmate_scaffold.dart';
import '../navigation_runtime/navigation_controller.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = Theme.of(context).colorScheme;

    return NavMateScaffold(
      title: 'NavMate Live',
      actions: [
        IconButton(
          onPressed: () => context.push('/settings'),
          tooltip: 'Accessibility settings',
          icon: const Icon(Icons.tune_rounded),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              gradient: LinearGradient(
                colors: [
                  colors.primary,
                  colors.secondary,
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Voice-first indoor guidance for blind and low-vision users.',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: colors.onPrimary,
                      ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Start with your voice, keep QR optional, and recover calmly if confidence drops.',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: colors.onPrimary.withOpacity(0.92),
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => ref.read(navigationControllerProvider).startWithoutQr(),
            icon: const Icon(Icons.record_voice_over_rounded),
            label: const Text('Start Indoor Navigation'),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: () {
              ref.read(navigationControllerProvider).openQrScanner();
              context.go('/scan');
            },
            icon: const Icon(Icons.qr_code_scanner_rounded),
            label: const Text('Scan QR For Precise Start'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.push('/admin-survey'),
            child: const Text('Open Demo Admin Dashboard'),
          ),
          const SizedBox(height: 24),
          Text(
            'How it works',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView(
              children: const [
                _FeatureCard(
                  title: 'Say where you want to go',
                  body: 'Speak a destination like Registrar Office, Billing Counter, or Room 204.',
                ),
                SizedBox(height: 12),
                _FeatureCard(
                  title: 'Follow short spoken instructions',
                  body: 'Large text, high contrast, haptics, and a repeat button keep guidance easy to follow.',
                ),
                SizedBox(height: 12),
                _FeatureCard(
                  title: 'Recover safely if confidence drops',
                  body: 'Scan QR if available, return to a confirmed point, or reroute to the help desk.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.title,
    required this.body,
  });

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(body, style: Theme.of(context).textTheme.bodyLarge),
          ],
        ),
      ),
    );
  }
}
