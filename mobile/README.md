# Mobile

Flutter Android-first client for NavMate Live.

## Scope

- Voice-first start flow
- Optional QR entrance scan
- Entrance selection without QR
- Destination selection
- Voice-first navigation runtime
- Conversational assistant prompt
- Recovery mode when confidence drops
- High contrast, larger text, and vibration feedback settings

## Packages

- `flutter_riverpod`
- `go_router`
- `dio`
- `freezed`
- `json_serializable`
- `flutter_tts`
- `speech_to_text`
- `mobile_scanner`
- `sensors_plus`

## Run

```bash
flutter pub get
flutter run
```

## Notes

- The app is scaffolded around Android-first indoor navigation only.
- The core flow is `Home -> Entrance or QR -> Destination -> Navigation -> Recovery`.
- IMU calibration is intentionally marked as `TODO` pending real device tuning.
