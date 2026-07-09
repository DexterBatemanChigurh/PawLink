class TimelineEventModel {
  final String id;
  final String type;
  final String title;
  final String? description;
  final String eventDate;
  final String? vetName;
  final String? clinicName;
  final List<String> attachments;
  final String petId;

  TimelineEventModel({
    required this.id,
    required this.type,
    required this.title,
    this.description,
    required this.eventDate,
    this.vetName,
    this.clinicName,
    this.attachments = const [],
    required this.petId,
  });

  factory TimelineEventModel.fromJson(Map<String, dynamic> json) {
    return TimelineEventModel(
      id: json['id'] as String,
      type: json['type'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      eventDate: json['eventDate'] as String,
      vetName: json['vetName'] as String?,
      clinicName: json['clinicName'] as String?,
      attachments: (json['attachments'] as List?)?.cast<String>() ?? [],
      petId: json['petId'] as String,
    );
  }

  String get typeIcon {
    switch (type) {
      case 'birth': return '🎂';
      case 'rescue': return '🆘';
      case 'vaccine': return '💉';
      case 'castration': return '⚕️';
      case 'exam': return '🔬';
      case 'surgery': return '🏥';
      case 'adoption': return '🏡';
      case 'treatment': return '💊';
      case 'medication': return '💊';
      case 'weight': return '⚖️';
      case 'microchip': return '📡';
      case 'checkup': return '🩺';
      default: return '📌';
    }
  }

  String get typeLabel {
    switch (type) {
      case 'birth': return 'Nascimento';
      case 'rescue': return 'Resgate';
      case 'vaccine': return 'Vacina';
      case 'castration': return 'Castração';
      case 'exam': return 'Exame';
      case 'surgery': return 'Cirurgia';
      case 'adoption': return 'Adoção';
      case 'treatment': return 'Tratamento';
      case 'medication': return 'Medicação';
      case 'weight': return 'Peso';
      case 'microchip': return 'Microchip';
      case 'checkup': return 'Check-up';
      default: return 'Outro';
    }
  }
}
