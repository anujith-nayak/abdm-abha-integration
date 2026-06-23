import 'package:flutter/material.dart';
import '../models/abha_response.dart';
import '../services/api_service.dart';

class AbhaScreen extends StatefulWidget {
  const AbhaScreen({super.key});

  @override
  State<AbhaScreen> createState() => _AbhaScreenState();
}

class _AbhaScreenState extends State<AbhaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _aadhaarController = TextEditingController();
  final _otpController = TextEditingController();

  bool _isLoading = false;
  bool _otpSent = false;
  String? _txnId;
  AbhaResponse? _abhaResponse;

  @override
  void dispose() {
    _aadhaarController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _showSnackbar(String message) async {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red.shade700,
      ),
    );
  }

  Future<void> _generateOtp() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _abhaResponse = null;
    });

    final aadhaar = _aadhaarController.text.trim();

    try {
      final txnId = await ApiService.generateOtp(aadhaar);
      setState(() {
        _txnId = txnId;
        _otpSent = true;
        _otpController.clear();
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('OTP sent successfully. Enter OTP to verify.'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (error) {
      await _showSnackbar(error.toString());
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    if (!_formKey.currentState!.validate() || _txnId == null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _abhaResponse = null;
    });

    final otp = _otpController.text.trim();

    try {
      final response = await ApiService.verifyOtp(otp, _txnId!);
      setState(() {
        _abhaResponse = response;
      });
    } catch (error) {
      await _showSnackbar(error.toString());
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildFormCard() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'ABHA Registration',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Register your ABHA by verifying Aadhaar and OTP. This secure workflow integrates with the hospital management system and backend service seamlessly.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),
              TextFormField(
                controller: _aadhaarController,
                keyboardType: TextInputType.number,
                maxLength: 12,
                decoration: const InputDecoration(
                  labelText: 'Aadhaar Number',
                  hintText: 'Enter 12-digit Aadhaar',
                ),
                validator: (value) {
                  final text = value?.trim() ?? '';
                  if (text.isEmpty) {
                    return 'Aadhaar number is required';
                  }
                  if (text.length != 12 || int.tryParse(text) == null) {
                    return 'Enter a valid 12-digit Aadhaar number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              FilledButton.tonal(
                onPressed: _isLoading ? null : _generateOtp,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 14),
                  child: Text('Generate OTP'),
                ),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 24),
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: const InputDecoration(
                    labelText: 'OTP',
                    hintText: 'Enter received OTP',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.isEmpty) {
                      return 'OTP is required';
                    }
                    if (text.length != 6 || int.tryParse(text) == null) {
                      return 'Enter a valid 6-digit OTP';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _isLoading ? null : _verifyOtp,
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text('Verify OTP'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessCard() {
    if (_abhaResponse == null) {
      return const SizedBox.shrink();
    }

    return Card(
      color: const Color(0xFFECFDF5),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.verified, color: Colors.teal, size: 28),
                const SizedBox(width: 10),
                Text(
                  'Registration Successful',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoTile('ABHA Number', _abhaResponse!.abhaNumber),
            _buildInfoTile('ABHA Address', _abhaResponse!.abhaAddress),
            _buildInfoTile('Full Name', _abhaResponse!.name),
            _buildInfoTile('Gender', _abhaResponse!.gender),
            _buildInfoTile('Date of Birth', _abhaResponse!.dob),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              '$label:',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ABHA Registration'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 700),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildFormCard(),
                const SizedBox(height: 24),
                if (_isLoading)
                  const Center(child: CircularProgressIndicator()),
                if (_abhaResponse != null) _buildSuccessCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
