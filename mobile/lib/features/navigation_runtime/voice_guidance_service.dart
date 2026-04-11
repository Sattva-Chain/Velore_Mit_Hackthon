import 'package:flutter_tts/flutter_tts.dart';

class VoiceGuidanceService {
  VoiceGuidanceService() {
    _tts.setSpeechRate(0.46);
    _tts.setPitch(1.0);
  }

  final FlutterTts _tts = FlutterTts();

  Future<void> speak(String text) async {
    await _tts.stop();
    await _tts.speak(text);
  }
}
