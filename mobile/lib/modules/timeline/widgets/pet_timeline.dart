import 'package:flutter/material.dart';
import '../../../core/network/timeline_service.dart';
import '../models/timeline_event_model.dart';

class PetTimeline extends StatefulWidget {
  final String petId;
  const PetTimeline({super.key, required this.petId});

  @override
  State<PetTimeline> createState() => _PetTimelineState();
}

class _PetTimelineState extends State<PetTimeline> {
  final _service = TimelineService();
  List<TimelineEventModel> _events = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getTimeline(widget.petId);
      if (mounted) {
        setState(() {
          _events = data.map((e) => TimelineEventModel.fromJson(e as Map<String, dynamic>)).toList();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_events.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Column(
            children: [
              Text('📋', style: TextStyle(fontSize: 40)),
              const SizedBox(height: 8),
              Text('Nenhum evento registrado ainda',
                  style: TextStyle(color: Colors.grey.shade600)),
            ],
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Histórico', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _events.length,
            itemBuilder: (context, index) {
              final event = _events[index];
              final isFirst = index == 0;
              final isLast = index == _events.length - 1;
              return _TimelineItem(
                event: event,
                isFirst: isFirst,
                isLast: isLast,
              );
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final TimelineEventModel event;
  final bool isFirst;
  final bool isLast;

  const _TimelineItem({
    required this.event,
    required this.isFirst,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    final date = event.eventDate.split('-').reversed.join('/');
    final color = _getTypeColor();

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 40,
            child: Column(
              children: [
                if (!isFirst)
                  Expanded(child: Container(width: 2, color: Colors.grey.shade200))
                else
                  const Expanded(child: SizedBox()),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Center(child: Text(event.typeIcon, style: const TextStyle(fontSize: 14))),
                ),
                if (!isLast)
                  Expanded(child: Container(width: 2, color: Colors.grey.shade200))
                else
                  const Expanded(child: SizedBox()),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(event.typeLabel,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: color,
                          )),
                      Text(date,
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(event.title,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  if (event.description != null) ...[
                    const SizedBox(height: 4),
                    Text(event.description!,
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                  ],
                  if (event.vetName != null) ...[
                    const SizedBox(height: 4),
                    Text('👨‍⚕️ ${event.vetName}',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  ],
                  if (event.clinicName != null)
                    Text('🏥 ${event.clinicName}',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getTypeColor() {
    switch (event.type) {
      case 'birth': return Colors.pink;
      case 'rescue': return Colors.orange;
      case 'vaccine': return Colors.blue;
      case 'castration': return Colors.purple;
      case 'exam': return Colors.teal;
      case 'surgery': return Colors.red;
      case 'adoption': return Colors.green;
      case 'treatment': return Colors.amber;
      case 'checkup': return Colors.cyan;
      default: return Colors.grey;
    }
  }
}
