import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/navigation_models.dart';

enum AppState {
  home,
  selectingEntrance,
  selectingDestination,
  navigating,
  recovering,
  arrived,
  scanningQr,
}

class SessionStoreState {
  const SessionStoreState({
    required this.appState,
    this.session,
    this.destinations = const [],
    this.entrances = const [],
    this.lastQrCodeValue,
    this.lastSpokenText = '',
  });

  final AppState appState;
  final NavigationSessionDto? session;
  final List<DestinationDto> destinations;
  final List<EntranceOptionDto> entrances;
  final String? lastQrCodeValue;
  final String lastSpokenText;

  SessionStoreState copyWith({
    AppState? appState,
    NavigationSessionDto? session,
    List<DestinationDto>? destinations,
    List<EntranceOptionDto>? entrances,
    String? lastQrCodeValue,
    String? lastSpokenText,
  }) {
    return SessionStoreState(
      appState: appState ?? this.appState,
      session: session ?? this.session,
      destinations: destinations ?? this.destinations,
      entrances: entrances ?? this.entrances,
      lastQrCodeValue: lastQrCodeValue ?? this.lastQrCodeValue,
      lastSpokenText: lastSpokenText ?? this.lastSpokenText,
    );
  }
}

class SessionStore extends StateNotifier<SessionStoreState> {
  SessionStore() : super(const SessionStoreState(appState: AppState.home));

  void setSession(
    NavigationSessionDto session, {
    AppState? appState,
    String? lastQrCodeValue,
    String? lastSpokenText,
  }) {
    state = state.copyWith(
      session: session,
      destinations: session.availableDestinations,
      entrances: session.entranceOptions,
      lastQrCodeValue: lastQrCodeValue ?? state.lastQrCodeValue,
      lastSpokenText: lastSpokenText ?? state.lastSpokenText,
      appState: appState ?? _deriveAppState(session),
    );
  }

  void setDestinations(List<DestinationDto> destinations) {
    state = state.copyWith(destinations: destinations);
  }

  void setSpokenText(String value) {
    state = state.copyWith(lastSpokenText: value);
  }

  void setAppState(AppState appState) {
    state = state.copyWith(appState: appState);
  }

  void reset() {
    state = const SessionStoreState(appState: AppState.home);
  }

  AppState _deriveAppState(NavigationSessionDto session) {
    switch (session.status.toLowerCase()) {
      case 'recovering':
        return AppState.recovering;
      case 'arrived':
        return AppState.arrived;
      case 'active':
        if (session.destinationNodeId != null) {
          return AppState.navigating;
        }
        return AppState.selectingDestination;
      default:
        return AppState.navigating;
    }
  }
}

final sessionStoreProvider =
    StateNotifierProvider<SessionStore, SessionStoreState>((ref) => SessionStore());
