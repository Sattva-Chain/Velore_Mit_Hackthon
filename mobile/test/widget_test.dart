import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:navmate_live_mobile/app_shell/navmate_app.dart';

void main() {
  testWidgets('app boots', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: NavMateApp()));
    expect(find.text('NavMate Live'), findsWidgets);
  });
}
