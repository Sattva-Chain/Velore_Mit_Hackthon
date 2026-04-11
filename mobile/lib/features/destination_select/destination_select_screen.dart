import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../../core/models/navigation_models.dart';
import '../../core/widgets/navmate_scaffold.dart';
import '../auth_session/session_store.dart';
import '../navigation_runtime/navigation_controller.dart';

class DestinationSelectScreen extends ConsumerStatefulWidget {
  const DestinationSelectScreen({super.key});

  @override
  ConsumerState<DestinationSelectScreen> createState() => _DestinationSelectScreenState();
}

class _DestinationSelectScreenState extends ConsumerState<DestinationSelectScreen> {
  final SpeechToText _speech = SpeechToText();
  String _heardText = '';
  final TextEditingController _textController = TextEditingController();

  List<DestinationDto> _filterDestinations(List<DestinationDto> destinations) {
    final query = _heardText.isNotEmpty ? _heardText : _textController.text;
    if (query.trim().isEmpty) {
      return destinations;
    }

    return destinations
        .where(
          (destination) =>
              destination.aliasText.toLowerCase().contains(query.toLowerCase()) ||
              destination.nodeName.toLowerCase().contains(query.toLowerCase()),
        )
        .toList();
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(sessionStoreProvider);
    final suggestedDestinations = state.session?.destinationSuggestions ?? const <DestinationDto>[];
    final destinations = _filterDestinations(
      suggestedDestinations.isNotEmpty ? suggestedDestinations : state.destinations,
    );
    final quickDestinations = state.destinations.take(4).toList();

    return NavMateScaffold(
      title: 'Destination',
      body: ListView(
        children: [
          Text(
            state.session?.voicePrompt ?? 'Where would you like to go?',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 10),
          Text(
            'Speak a destination or use the text fallback. Then confirm from the large cards below.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final available = await _speech.initialize();
                    if (!available) {
                      return;
                    }
                    await _speech.listen(onResult: (result) {
                      setState(() {
                        _heardText = result.recognizedWords;
                        _textController.text = result.recognizedWords;
                      });
                      ref.read(navigationControllerProvider).rememberSpokenText(result.recognizedWords);
                    });
                  },
                  icon: const Icon(Icons.mic_rounded),
                  label: const Text('Speak Destination'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: () => ref
                      .read(navigationControllerProvider)
                      .selectDestinationByVoice(_textController.text.trim()),
                  child: const Text('Find'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _textController,
            textInputAction: TextInputAction.search,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              labelText: 'Destination text',
              hintText: 'Registrar Office, Help Desk, Room 204',
            ),
          ),
          if (_heardText.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text('Heard: $_heardText'),
          ],
          const SizedBox(height: 22),
          Text('Quick destinations', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: quickDestinations
                  .map(
                    (destination) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: ActionChip(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                        label: Text(destination.aliasText),
                        onPressed: () =>
                            ref.read(navigationControllerProvider).selectDestination(destination),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 22),
          Text('Matching destinations', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          ...destinations.map(
            (destination) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () => ref.read(navigationControllerProvider).selectDestination(destination),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        const Icon(Icons.place_rounded, size: 32),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(destination.aliasText, style: Theme.of(context).textTheme.titleLarge),
                              const SizedBox(height: 6),
                              Text(destination.nodeName, style: Theme.of(context).textTheme.bodyLarge),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, size: 30),
                      ],
                    ),
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
