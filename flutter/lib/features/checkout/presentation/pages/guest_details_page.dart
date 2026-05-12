import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../cubit/checkout_cubit.dart';

class GuestDetailsPage extends StatefulWidget {
  final CheckoutCubit cubit;
  final String roomTypeId;
  final String? ratePlanId;
  final String propertyId;
  final String propertyName;
  final String roomTypeName;
  final double basePrice;
  final String checkin;
  final String checkout;
  final int adults;
  final int children;

  const GuestDetailsPage({
    super.key,
    required this.cubit,
    required this.roomTypeId,
    required this.ratePlanId,
    required this.propertyId,
    required this.propertyName,
    required this.roomTypeName,
    required this.basePrice,
    required this.checkin,
    required this.checkout,
    required this.adults,
    required this.children,
  });

  @override
  State<GuestDetailsPage> createState() => _GuestDetailsPageState();
}

class _GuestDetailsPageState extends State<GuestDetailsPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _countryCtrl = TextEditingController(text: 'India');
  final _specialRequestsCtrl = TextEditingController();
  String? _arrivalTime;
  bool _holdSucceeded = false;

  static const _arrivalOptions = [
    'Before 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00',
    'After 22:00',
  ];

  @override
  void initState() {
    super.initState();
    widget.cubit.createHold(
      roomTypeId: widget.roomTypeId,
      propertyId: widget.propertyId,
      checkin: widget.checkin,
      checkout: widget.checkout,
      adults: widget.adults,
      children: widget.children,
    );
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _countryCtrl.dispose();
    _specialRequestsCtrl.dispose();
    super.dispose();
  }

  int get _nights => du.nightsBetween(
        DateTime.parse(widget.checkin),
        DateTime.parse(widget.checkout),
      );

  void _onContinue(String holdId) {
    if (!_formKey.currentState!.validate()) return;
    context.goNamed(
      'payment',
      extra: {
        'cubit': widget.cubit,
        'holdId': holdId,
        'ratePlanId': widget.ratePlanId,
        'propertyName': widget.propertyName,
        'roomTypeName': widget.roomTypeName,
        'basePrice': widget.basePrice,
        'checkin': widget.checkin,
        'checkout': widget.checkout,
        'adults': widget.adults,
        'children': widget.children,
        'guestDetails': {
          'firstName': _firstNameCtrl.text.trim(),
          'lastName': _lastNameCtrl.text.trim(),
          'email': _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim(),
          'country': _countryCtrl.text.trim(),
          if (_arrivalTime != null) 'arrivalTime': _arrivalTime,
          if (_specialRequestsCtrl.text.isNotEmpty)
            'specialRequests': _specialRequestsCtrl.text.trim(),
        },
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CheckoutCubit>.value(
      value: widget.cubit,
      child: BlocConsumer<CheckoutCubit, CheckoutState>(
        listener: (context, state) {
          if (state is HoldReady) {
            setState(() => _holdSucceeded = true);
          } else if (state is CheckoutError && _holdSucceeded) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, state) {
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: const Text(
                'Guest Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            body: state is HoldLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppColors.primary),
                    ),
                  )
                : (state is CheckoutError && !_holdSucceeded)
                    ? _buildHoldError(state.message)
                    : _buildForm(state),
          );
        },
      ),
    );
  }

  Widget _buildHoldError(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56, color: AppColors.danger),
            const SizedBox(height: 12),
            Text(message,
                style: const TextStyle(color: AppColors.muted),
                textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () => widget.cubit.createHold(
                roomTypeId: widget.roomTypeId,
                propertyId: widget.propertyId,
                checkin: widget.checkin,
                checkout: widget.checkout,
                adults: widget.adults,
                children: widget.children,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm(CheckoutState state) {
    final holdId = state is HoldReady ? state.holdId : null;
    final nights = _nights;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSummaryCard(nights),
          const SizedBox(height: 20),
          const Text(
            'Your details',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 12),
          Form(
            key: _formKey,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(child: _field(_firstNameCtrl, 'First name', required: true)),
                    const SizedBox(width: 12),
                    Expanded(child: _field(_lastNameCtrl, 'Last name', required: true)),
                  ],
                ),
                const SizedBox(height: 12),
                _field(_emailCtrl, 'Email address',
                    required: true,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Required';
                      if (!v.contains('@')) return 'Invalid email';
                      return null;
                    }),
                const SizedBox(height: 12),
                _field(_phoneCtrl, 'Phone number',
                    required: true, keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                _field(_countryCtrl, 'Country', required: true),
                const SizedBox(height: 12),
                _buildArrivalDropdown(),
                const SizedBox(height: 12),
                _field(_specialRequestsCtrl, 'Special requests (optional)',
                    required: false, maxLines: 3),
              ],
            ),
          ),
          const SizedBox(height: 28),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: holdId != null ? () => _onContinue(holdId) : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.border,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                textStyle: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              child: holdId == null
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text('Continue to Payment'),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(int nights) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.propertyName,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.roomTypeName,
            style: const TextStyle(fontSize: 13, color: AppColors.muted),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _summaryItem(
                  'Check-in',
                  du.formatDate(DateTime.parse(widget.checkin))),
              const SizedBox(width: 16),
              Container(width: 1, height: 28, color: AppColors.border),
              const SizedBox(width: 16),
              _summaryItem(
                  'Check-out',
                  du.formatDate(DateTime.parse(widget.checkout))),
              const Spacer(),
              _summaryItem(du.formatNights(nights),
                  formatInr(widget.basePrice * nights)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 10, color: AppColors.muted)),
          const SizedBox(height: 2),
          Text(value,
              style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text)),
        ],
      );

  Widget _field(
    TextEditingController ctrl,
    String label, {
    bool required = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 13, color: AppColors.muted),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      validator: validator ??
          (v) {
            if (required && (v == null || v.trim().isEmpty)) return 'Required';
            return null;
          },
    );
  }

  Widget _buildArrivalDropdown() {
    return DropdownButtonFormField<String>(
      initialValue: _arrivalTime,
      decoration: InputDecoration(
        labelText: 'Estimated arrival time (optional)',
        labelStyle: const TextStyle(fontSize: 13, color: AppColors.muted),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
      items: _arrivalOptions
          .map((o) => DropdownMenuItem(value: o, child: Text(o, style: const TextStyle(fontSize: 13))))
          .toList(),
      onChanged: (v) => setState(() => _arrivalTime = v),
    );
  }
}
