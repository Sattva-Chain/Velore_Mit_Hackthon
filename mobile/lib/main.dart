import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_shell/navmate_app.dart';

void main() {
  runApp(const ProviderScope(child: NavMateApp()));
}
