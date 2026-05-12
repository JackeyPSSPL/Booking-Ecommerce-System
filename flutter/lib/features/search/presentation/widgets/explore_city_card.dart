import 'package:flutter/material.dart';
import '../../domain/entities/destination_entity.dart';

final _cityColors = [
  const Color(0xFF003580),
  const Color(0xFF0063B1),
  const Color(0xFF006064),
  const Color(0xFF1B5E20),
  const Color(0xFF4A148C),
  const Color(0xFF880E4F),
  const Color(0xFFE65100),
  const Color(0xFF37474F),
];

Color _colorForCity(String city) {
  final hash = city.codeUnits.fold(0, (acc, c) => acc + c);
  return _cityColors[hash % _cityColors.length];
}

class ExploreCityCard extends StatelessWidget {
  final DestinationEntity destination;
  final VoidCallback onTap;

  const ExploreCityCard({
    super.key,
    required this.destination,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = _colorForCity(destination.city);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 140,
        height: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color, color.withValues(alpha: 0.7)],
          ),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              top: -10,
              right: -10,
              child: Text(
                destination.city[0].toUpperCase(),
                style: TextStyle(
                  fontSize: 72,
                  fontWeight: FontWeight.w900,
                  color: Colors.white.withValues(alpha: 0.15),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    destination.city,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${destination.count} ${destination.count == 1 ? 'property' : 'properties'}',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.85),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
