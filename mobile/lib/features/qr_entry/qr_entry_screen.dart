import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/widgets/navmate_scaffold.dart';
import '../auth_session/session_store.dart';
import '../navigation_runtime/navigation_controller.dart';

class QrEntryScreen extends ConsumerStatefulWidget {
  const QrEntryScreen({super.key});

  @override
  ConsumerState<QrEntryScreen> createState() => _QrEntryScreenState();
}

class _QrEntryScreenState extends ConsumerState<QrEntryScreen> {
  bool _handled = false;

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionStoreProvider).session;
    final isReanchor = session != null;

    return NavMateScaffold(
      title: isReanchor ? 'Scan QR To Reconfirm' : 'Scan QR To Start',
      actions: [
        IconButton(
          onPressed: () => ref.read(sessionStoreProvider.notifier).setAppState(
                isReanchor ? AppState.navigating : AppState.home,
              ),
          icon: const Icon(Icons.close_rounded),
          tooltip: 'Close QR scanner',
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isReanchor
                ? 'Scan any nearby QR anchor to improve confidence and reset your position.'
                : 'Scan a building QR marker for precise starting position, or go back to begin without QR.',
            semanticsLabel: isReanchor
                ? 'Scan any nearby QR anchor to improve confidence and reset your position.'
                : 'Scan a building QR marker for precise starting position, or go back to begin without QR.',
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: MobileScanner(
                onDetect: (capture) async {
                  if (_handled || capture.barcodes.isEmpty) {
                    return;
                  }
                  final code = capture.barcodes.first.rawValue;
                  if (code == null || code.isEmpty) {
                    return;
                  }
                  _handled = true;
                  await ref.read(navigationControllerProvider).reanchor(code);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () async {
              _handled = true;
              await ref
                  .read(navigationControllerProvider)
                  .reanchor(isReanchor ? 'ANCHOR-VC-G-LOBBY' : 'ANCHOR-VC-G-MAIN');
            },
            icon: const Icon(Icons.qr_code_2_rounded),
            label: Text(isReanchor ? 'Use Demo Lobby QR' : 'Use Demo Entrance QR'),
          ),
        ],
      ),
    );
  }
}
