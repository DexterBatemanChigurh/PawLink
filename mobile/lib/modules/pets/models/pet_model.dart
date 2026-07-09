class PetModel {
  final String id;
  final String name;
  final String species;
  final String? breed;
  final int? age;
  final String? size;
  final double? weight;
  final bool castrated;
  final bool vaccinated;
  final String? temperament;
  final String? story;
  final String? city;
  final String? state;
  final String status;
  final List<String> photos;
  final String? videoUrl;
  final String ownerId;
  final String createdAt;

  PetModel({
    required this.id,
    required this.name,
    required this.species,
    this.breed,
    this.age,
    this.size,
    this.weight,
    this.castrated = false,
    this.vaccinated = false,
    this.temperament,
    this.story,
    this.city,
    this.state,
    this.status = 'available',
    this.photos = const [],
    this.videoUrl,
    required this.ownerId,
    required this.createdAt,
  });

  factory PetModel.fromJson(Map<String, dynamic> json) {
    return PetModel(
      id: json['id'] as String,
      name: json['name'] as String,
      species: json['species'] as String,
      breed: json['breed'] as String?,
      age: json['age'] as int?,
      size: json['size'] as String?,
      weight: (json['weight'] as num?)?.toDouble(),
      castrated: json['castrated'] as bool? ?? false,
      vaccinated: json['vaccinated'] as bool? ?? false,
      temperament: json['temperament'] as String?,
      story: json['story'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      status: json['status'] as String? ?? 'available',
      photos: (json['photos'] as List?)?.cast<String>() ?? [],
      videoUrl: json['videoUrl'] as String?,
      ownerId: json['ownerId'] as String,
      createdAt: json['createdAt'] as String,
    );
  }

  String get speciesIcon {
    switch (species) {
      case 'dog': return '🐕';
      case 'cat': return '🐈';
      case 'bird': return '🐦';
      case 'rabbit': return '🐇';
      case 'hamster': return '🐹';
      default: return '🐾';
    }
  }

  String get statusLabel {
    switch (status) {
      case 'available': return 'Disponível';
      case 'adopted': return 'Adotado';
      case 'in_treatment': return 'Em tratamento';
      default: return status;
    }
  }
}
