import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/network/pet_service.dart';
import '../../../core/network/match_service.dart';
import '../models/pet_model.dart';
import '../../timeline/widgets/pet_timeline.dart';

class PetDetailScreen extends StatefulWidget {
  final String petId;

  const PetDetailScreen({super.key, required this.petId});

  @override
  State<PetDetailScreen> createState() => _PetDetailScreenState();
}

class _PetDetailScreenState extends State<PetDetailScreen> {
  final _petService = PetService();
  final _matchService = MatchService();
  PetModel? _pet;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPet();
  }

  Future<void> _loadPet() async {
    try {
      final data = await _petService.getPetById(widget.petId);
      if (mounted) {
        setState(() {
          _pet = PetModel.fromJson(data);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showInterestDialog() {
    final messageController = TextEditingController();
    final phoneController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Quero Adotar!'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Conte um pouco sobre você e por que deseja adotar este pet:'),
              const SizedBox(height: 16),
              TextFormField(
                controller: messageController,
                decoration: const InputDecoration(
                  labelText: 'Mensagem',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                maxLength: 500,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefone para contato',
                  border: OutlineInputBorder(),
                  hintText: '(11) 99999-9999',
                ),
                keyboardType: TextInputType.phone,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              try {
                await _matchService.expressInterest(
                  widget.petId,
                  message: messageController.text,
                  phone: phoneController.text,
                );
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Interesse registrado com sucesso!')),
                  );
                }
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    SnackBar(content: Text('Erro: ${e.toString()}')),
                  );
                }
              }
            },
            child: const Text('Enviar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detalhes')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_pet == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Detalhes')),
        body: const Center(child: Text('Pet não encontrado')),
      );
    }

    final pet = _pet!;
    final speciesLabels = {'dog': 'Cachorro', 'cat': 'Gato', 'bird': 'Pássaro', 'rabbit': 'Coelho', 'hamster': 'Hamster'};

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: pet.photos.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: pet.photos.first,
                      fit: BoxFit.cover,
                      width: double.infinity,
                    )
                  : Container(
                      color: Colors.grey.shade200,
                      child: Center(child: Text(pet.speciesIcon, style: const TextStyle(fontSize: 64))),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(pet.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: pet.status == 'available' ? Colors.green.shade50 : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          pet.statusLabel,
                          style: TextStyle(
                            color: pet.status == 'available' ? Colors.green.shade700 : Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(speciesLabels[pet.species] ?? pet.species, style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      _InfoChip(icon: Icons.pets, label: pet.breed ?? 'SRD'),
                      if (pet.age != null) ...[
                        const SizedBox(width: 12),
                        _InfoChip(icon: Icons.cake, label: '${pet.age} ${pet.age == 1 ? 'ano' : 'anos'}'),
                      ],
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (pet.temperament != null) ...[
                    const Text('Temperamento', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(pet.temperament!, style: TextStyle(color: Colors.grey.shade700, fontSize: 14)),
                    const SizedBox(height: 16),
                  ],

                  if (pet.story != null) ...[
                    const Text('História', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(pet.story!, style: TextStyle(color: Colors.grey.shade700, fontSize: 14)),
                    const SizedBox(height: 16),
                  ],

                  Wrap(
                    spacing: 8,
                    children: [
                      if (pet.castrated) _Tag(label: 'Castrado'),
                      if (pet.vaccinated) _Tag(label: 'Vacinado'),
                      if (pet.city != null) _Tag(label: '📍 ${pet.city}'),
                    ],
                  ),

                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _showInterestDialog,
                      icon: const Icon(Icons.favorite),
                      label: const Text('Quero Adotar!', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: PetTimeline(petId: widget.petId),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 16),
      label: Text(label),
    );
  }
}

class _Tag extends StatelessWidget {
  final String label;

  const _Tag({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: TextStyle(
        color: Theme.of(context).colorScheme.primary,
        fontSize: 12,
      )),
    );
  }
}
