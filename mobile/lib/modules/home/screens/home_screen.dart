import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/network/pet_service.dart';
import '../../../core/network/auth_service.dart';
import '../../../core/routes/app_routes.dart';
import '../../pets/models/pet_model.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _petService = PetService();
  final _authService = AuthService();
  List<PetModel> _pets = [];
  bool _isLoading = true;
  String _selectedSpecies = '';

  final _species = [
    {'key': '', 'label': 'Todos', 'icon': '🐾'},
    {'key': 'dog', 'label': 'Cachorros', 'icon': '🐕'},
    {'key': 'cat', 'label': 'Gatos', 'icon': '🐈'},
    {'key': 'bird', 'label': 'Pássaros', 'icon': '🐦'},
    {'key': 'rabbit', 'label': 'Coelhos', 'icon': '🐇'},
  ];

  @override
  void initState() {
    super.initState();
    _loadPets();
  }

  Future<void> _loadPets() async {
    setState(() => _isLoading = true);
    try {
      final data = await _petService.getPets(species: _selectedSpecies.isEmpty ? null : _selectedSpecies);
      setState(() => _pets = data.map((e) => PetModel.fromJson(e as Map<String, dynamic>)).toList());
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (mounted) {
      Navigator.pushReplacementNamed(context, AppRoutes.login);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PawLink'),
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_outline),
            tooltip: 'Meus Pedidos',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.myMatches),
          ),
          IconButton(
            icon: const Icon(Icons.inbox_outlined),
            tooltip: 'Solicitações Recebidas',
            onPressed: () => Navigator.pushNamed(context, AppRoutes.receivedMatches),
          ),
          IconButton(
            icon: const Icon(Icons.exit_to_app),
            onPressed: _logout,
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 60,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: _species.map((s) {
                final selected = _selectedSpecies == s['key'];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text('${s['icon']} ${s['label']}'),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _selectedSpecies = s['key'] as String);
                      _loadPets();
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _pets.isEmpty
                    ? const Center(child: Text('Nenhum pet encontrado'))
                    : RefreshIndicator(
                        onRefresh: _loadPets,
                        child: GridView.builder(
                          padding: const EdgeInsets.all(12),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.7,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _pets.length,
                          itemBuilder: (context, index) => _PetCard(
                            pet: _pets[index],
                            onTap: () => Navigator.pushNamed(
                              context,
                              AppRoutes.petDetails,
                              arguments: _pets[index].id,
                            ),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _PetCard extends StatelessWidget {
  final PetModel pet;
  final VoidCallback onTap;

  const _PetCard({required this.pet, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                color: Colors.grey.shade100,
                child: pet.photos.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: pet.photos.first,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => const Center(child: CircularProgressIndicator()),
                        errorWidget: (_, __, ___) => Center(child: Text(pet.speciesIcon, style: const TextStyle(fontSize: 32))),
                      )
                    : Center(child: Text(pet.speciesIcon, style: const TextStyle(fontSize: 32))),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(pet.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 2),
                  if (pet.breed != null)
                    Text(pet.breed!, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                  if (pet.age != null)
                    Text('${pet.age} ${pet.age == 1 ? 'ano' : 'anos'}', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
