class AbhaResponse {
  final String abhaNumber;
  final String abhaAddress;
  final String name;
  final String gender;
  final String dob;

  AbhaResponse({
    required this.abhaNumber,
    required this.abhaAddress,
    required this.name,
    required this.gender,
    required this.dob,
  });

  factory AbhaResponse.fromJson(Map<String, dynamic> json) {
    return AbhaResponse(
      abhaNumber: json['abhaNumber'] as String? ?? '',
      abhaAddress: json['abhaAddress'] as String? ?? '',
      name: json['name'] as String? ?? '',
      gender: json['gender'] as String? ?? '',
      dob: json['dob'] as String? ?? '',
    );
  }
}
