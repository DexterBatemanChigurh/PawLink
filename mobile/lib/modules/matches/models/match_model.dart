class MatchModel {
  final String id;
  final String petId;
  final String interestedUserId;
  final String status;
  final String? message;
  final String? phone;
  final Map<String, dynamic>? pet;
  final Map<String, dynamic>? interestedUser;
  final String createdAt;

  MatchModel({
    required this.id,
    required this.petId,
    required this.interestedUserId,
    required this.status,
    this.message,
    this.phone,
    this.pet,
    this.interestedUser,
    required this.createdAt,
  });

  factory MatchModel.fromJson(Map<String, dynamic> json) {
    return MatchModel(
      id: json['id'] as String,
      petId: json['petId'] as String,
      interestedUserId: json['interestedUserId'] as String,
      status: json['status'] as String,
      message: json['message'] as String?,
      phone: json['phone'] as String?,
      pet: json['pet'] as Map<String, dynamic>?,
      interestedUser: json['interestedUser'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] as String,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'rejected': return 'Recusado';
      case 'adopted': return 'Adotado';
      default: return status;
    }
  }
}
