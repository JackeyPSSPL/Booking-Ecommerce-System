import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../domain/entities/property_entity.dart';

class RoomTypeCard extends StatelessWidget {
  final RoomTypeEntity roomType;
  final VoidCallback onReserve;

  const RoomTypeCard({
    super.key,
    required this.roomType,
    required this.onReserve,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  roomType.name,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.person_outline,
                      size: 14, color: AppColors.muted),
                  const SizedBox(width: 3),
                  Text(
                    'Up to ${roomType.maxOccupancy}',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.muted),
                  ),
                ],
              ),
            ],
          ),
          if (roomType.description != null) ...[
            const SizedBox(height: 4),
            Text(
              roomType.description!,
              style: const TextStyle(fontSize: 12, color: AppColors.muted),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              _badge(
                roomType.mealPlan == 'BREAKFAST'
                    ? 'Breakfast incl.'
                    : 'No meals',
                roomType.mealPlan == 'BREAKFAST'
                    ? AppColors.success
                    : AppColors.muted,
              ),
              const SizedBox(width: 8),
              _badge(
                roomType.cancellationPolicy == 'FLEXIBLE'
                    ? 'Free cancellation'
                    : 'Non-refundable',
                roomType.cancellationPolicy == 'FLEXIBLE'
                    ? AppColors.success
                    : AppColors.danger,
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    formatInr(roomType.basePrice),
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const Text(
                    'per night',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
              SizedBox(
                height: 40,
                child: ElevatedButton(
                  onPressed: onReserve,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: AppColors.primaryDark,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    textStyle: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  child: const Text('Reserve'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }
}
