class UserModel {
  final String id;
  final String email;
  final String name;
  final String? avatar;
  final String role;
  final String status;

  UserModel({
    required this.id,
    required this.email,
    required this.name,
    this.avatar,
    this.role = 'user',
    this.status = 'active',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
      role: json['role'] as String? ?? 'user',
      status: json['status'] as String? ?? 'active',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    'avatar': avatar,
    'role': role,
    'status': status,
  };
}
