import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../core/widgets/navmate_scaffold.dart';

class AdminSurveyPlaceholder extends ConsumerWidget {
  const AdminSurveyPlaceholder({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardFuture = ref.watch(_adminDashboardProvider);

    return NavMateScaffold(
      title: 'Admin Dashboard',
      body: dashboardFuture.when(
        data: (data) => ListView(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Demo credentials', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 10),
                    Text('Email: admin@navmate.live', style: Theme.of(context).textTheme.bodyLarge),
                    Text('Password: admin123', style: Theme.of(context).textTheme.bodyLarge),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...data.entries.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: ListTile(
                    title: Text(entry.key),
                    subtitle: Text('${entry.value} configured'),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'Use the backend admin REST APIs to create buildings, nodes, edges, anchors, landmarks, destination aliases, route-state events, and to publish floors.',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
              ),
            ),
          ],
        ),
        error: (_, __) => const Center(child: Text('Admin data is not available yet.')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

final _adminDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/admin/dashboard');
  return Map<String, dynamic>.from(response.data as Map);
});
