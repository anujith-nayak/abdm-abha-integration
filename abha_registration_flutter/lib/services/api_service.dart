import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/abha_response.dart';

class ApiService {
  static const String _baseUrl = 'http://localhost:8080';

  /// Sends a GET request to generate an OTP for the provided Aadhaar number.
  /// Returns the transaction ID (txnId) for later verification.
  static Future<String> generateOtp(String aadhaar) async {
    final uri = Uri.parse('$_baseUrl/api/abha/generate-otp')
        .replace(queryParameters: {'aadhaar': aadhaar});

    final response = await http.get(uri);
    if (response.statusCode != 200) {
      throw Exception('Failed to send OTP. Status code: ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    if (!body.containsKey('txnId')) {
      throw Exception('Unexpected response from server.');
    }

    return body['txnId'] as String;
  }

  /// Sends a POST request to verify OTP and returns ABHA registration details.
  static Future<AbhaResponse> verifyOtp(String otp, String txnId) async {
    final uri = Uri.parse('$_baseUrl/api/abha/verify-otp');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'otp': otp, 'txnId': txnId}),
    );

    if (response.statusCode != 200) {
      throw Exception('OTP verification failed. Status code: ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return AbhaResponse.fromJson(body);
  }
}
