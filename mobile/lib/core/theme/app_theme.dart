import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light({required bool highContrast}) {
    final colorScheme = highContrast
        ? const ColorScheme.highContrastLight(
            primary: Color(0xFF072E33),
            onPrimary: Colors.white,
            secondary: Color(0xFF0A6C74),
            onSecondary: Colors.white,
            surface: Color(0xFFFFFCF5),
            onSurface: Color(0xFF101414),
          )
        : const ColorScheme.light(
            primary: Color(0xFF0B5D66),
            onPrimary: Colors.white,
            secondary: Color(0xFF176B75),
            onSecondary: Colors.white,
            surface: Color(0xFFF8F5EC),
            onSurface: Color(0xFF1A1F1F),
            error: Color(0xFFB9382F),
          );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: highContrast ? Colors.white : const Color(0xFFF4F1E8),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        foregroundColor: colorScheme.onSurface,
        titleTextStyle: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: colorScheme.onSurface,
        ),
      ),
      textTheme: TextTheme(
        headlineLarge: TextStyle(
          fontSize: 38,
          height: 1.08,
          fontWeight: FontWeight.w800,
          color: colorScheme.onSurface,
        ),
        headlineMedium: TextStyle(
          fontSize: 30,
          height: 1.12,
          fontWeight: FontWeight.w800,
          color: colorScheme.onSurface,
        ),
        headlineSmall: TextStyle(
          fontSize: 24,
          height: 1.2,
          fontWeight: FontWeight.w800,
          color: colorScheme.onSurface,
        ),
        titleLarge: TextStyle(
          fontSize: 20,
          height: 1.3,
          fontWeight: FontWeight.w700,
          color: colorScheme.onSurface,
        ),
        bodyLarge: TextStyle(
          fontSize: 18,
          height: 1.45,
          fontWeight: FontWeight.w500,
          color: colorScheme.onSurface,
        ),
        bodyMedium: TextStyle(
          fontSize: 16,
          height: 1.45,
          color: colorScheme.onSurface.withOpacity(0.88),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        margin: EdgeInsets.zero,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(68),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          textStyle: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(64),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          side: BorderSide(color: colorScheme.primary, width: 1.6),
          textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(22),
          borderSide: BorderSide(color: colorScheme.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      ),
    );
  }
}
