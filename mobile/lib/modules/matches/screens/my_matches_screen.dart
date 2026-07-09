import 'package:flutter/material.dart';
import '../../../core/network/match_service.dart';
import '../models/match_model.dart';

class MyMatchesScreen extends StatefulWidget {
  final bool received;

  const MyMatchesScreen({super.key, this.received = false});

  @override
  State<MyMatchesScreen> createState() => _MyMatchesScreenState();
}

class _MyMatchesScreenState extends State<MyMatchesScreen> {
  final _matchService = MatchService();
  List<MatchModel> _matches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMatches();
  }

  Future<void> _loadMatches() async {
    try {
      final data = widget.received
          ? await _matchService.getReceivedRequests()
          : await _matchService.getMyRequests();
      if (mounted) {
        setState(() {
          _matches = data.map((e) => MatchModel.fromJson(e as Map<String, dynamic>)).toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'accepted': return Colors.green;
      case 'rejected': return Colors.red;
      case 'adopted': return Colors.blue;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.received ? 'Solicitações Recebidas' : 'Meus Pedidos';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _matches.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text('😕', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 16),
                      Text(
                        widget.received
                            ? 'Nenhuma solicitação recebida'
                            : 'Você ainda não fez nenhum pedido',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMatches,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _matches.length,
                    itemBuilder: (context, index) {
                      final match = _matches[index];
                      final petName = match.pet?['name'] ?? 'Pet';
                      final userName = match.interestedUser?['name'] ?? 'Usuário';

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      widget.received ? userName : petName,
                                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _statusColor(match.status).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      match.statusLabel,
                                      style: TextStyle(
                                        color: _statusColor(match.status),
                                        fontWeight: FontWeight.w500,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (widget.received) ...[
                                const SizedBox(height: 4),
                                Text('Pet: $petName', style: TextStyle(color: Colors.grey.shade600)),
                              ],
                              if (match.message != null) ...[
                                const SizedBox(height: 8),
                                Text(match.message!),
                              ],
                              if (match.phone != null) ...[
                                const SizedBox(height: 4),
                                Text('📞 ${match.phone}', style: TextStyle(color: Colors.grey.shade600)),
                              ],
                              const SizedBox(height: 8),
                              Text(
                                'Enviado em ${match.createdAt.substring(0, 10)}',
                                style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
