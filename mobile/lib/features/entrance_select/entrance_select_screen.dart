import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../core/models/navigation_models.dart';
import '../../core/widgets/navmate_scaffold.dart';
import '../auth_session/session_store.dart';
import '../navigation_runtime/navigation_controller.dart';

class EntranceSelectScreen extends ConsumerStatefulWidget {
  const EntranceSelectScreen({super.key});

  @override
  ConsumerState<EntranceSelectScreen> createState() => _EntranceSelectScreenState();
}

class _EntranceSelectScreenState extends ConsumerState<EntranceSelectScreen> {
  final SpeechToText _speech = SpeechToText();
  String _heardText = '';

  List<EntranceOptionDto> _filtered(List<EntranceOptionDto> options) {
    if (_heardText.trim().isEmpty) {
      return options;
    }

    return options
        .where((option) => option.label.toLowerCase().contains(_heardText.toLowerCase()))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sessionStoreProvider);
    final entrances = _filtered(state.entrances);

    return NavMateScaffold(
      title: 'Choose Entrance',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Where are you entering from?',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 10),
          Text(
            'Choose by voice or tap a large card below. QR is still optional.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: () async {
              final available = await _speech.initialize();
              if (!available) {
                return;
              }
              await _speech.listen(onResult: (result) {
                setState(() {
                  _heardText = result.recognizedWords;
                });
              });
            },
            icon: const Icon(Icons.mic_rounded),
            label: const Text('Speak Entrance'),
          ),
          if (_heardText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Heard: $_heardText'),
          ],
          const SizedBox(height: 16),
          Expanded(
            child: ListView.separated(
              itemCount: entrances.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final entrance = entrances[index];
                return Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => ref.read(navigationControllerProvider).selectEntrance(entrance),
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          const Icon(Icons.place_outlined, size: 30),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(
                              entrance.label,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, size: 30),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
