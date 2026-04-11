import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/admin_survey/admin_survey_placeholder.dart';
import '../../features/auth_session/session_store.dart';
import '../../features/destination_select/destination_select_screen.dart';
import '../../features/entrance_select/entrance_select_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/navigation_runtime/navigation_screen.dart';
import '../../features/qr_entry/qr_entry_screen.dart';
import '../../features/recovery/recovery_screen.dart';
import '../../features/settings_accessibility/settings_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final sessionState = ref.watch(sessionStoreProvider);

  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(path: '/entrance', builder: (context, state) => const EntranceSelectScreen()),
      GoRoute(path: '/scan', builder: (context, state) => const QrEntryScreen()),
      GoRoute(path: '/destinations', builder: (context, state) => const DestinationSelectScreen()),
      GoRoute(path: '/navigate', builder: (context, state) => const NavigationScreen()),
      GoRoute(path: '/recover', builder: (context, state) => const RecoveryScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
      GoRoute(path: '/admin-survey', builder: (context, state) => const AdminSurveyPlaceholder()),
    ],
    redirect: (context, state) {
      final path = state.uri.path;
      if (sessionState.appState == AppState.home && path != '/' && path != '/settings' && path != '/admin-survey') {
        return '/';
      }
      if (sessionState.appState == AppState.selectingEntrance && path != '/entrance') {
        return '/entrance';
      }
      if (sessionState.appState == AppState.scanningQr && path != '/scan') {
        return '/scan';
      }
      if (sessionState.appState == AppState.selectingDestination && path != '/destinations') {
        return '/destinations';
      }
      if (sessionState.appState == AppState.navigating && path != '/navigate') {
        return '/navigate';
      }
      if (sessionState.appState == AppState.recovering && path != '/recover') {
        return '/recover';
      }
      if (sessionState.appState == AppState.arrived && path != '/navigate') {
        return '/navigate';
      }
      return null;
    },
  );
});
