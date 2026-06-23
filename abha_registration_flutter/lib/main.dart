import 'package:flutter/material.dart';
import 'screens/abha_screen.dart';

void main() {
  runApp(const AbhaRegistrationApp());
}

class AbhaRegistrationApp extends StatelessWidget {
  const AbhaRegistrationApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ABHA Registration',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF4F7FB),
      ),
      home: const AbhaScreen(),
    );
  }
}
