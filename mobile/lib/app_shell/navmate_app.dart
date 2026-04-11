import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/router/app_router.dart';
import '../core/theme/app_theme.dart';
import '../features/settings_accessibility/accessibility_controller.dart';

class NavMateApp extends ConsumerWidget {
  const NavMateApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accessibility = ref.watch(accessibilityControllerProvider);
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'NavMate Live',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      theme: AppTheme.light(highContrast: accessibility.highContrast),
      builder: (context, child) {
        final scale = accessibility.largeText ? 1.2 : 1.0;
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(scale)),
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
