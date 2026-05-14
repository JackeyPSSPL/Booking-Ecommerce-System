import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/date_utils.dart' as du;
import '../cubit/checkout_cubit.dart';

class PaymentPage extends StatefulWidget {
  final CheckoutCubit cubit;
  final String holdId;
  final String? ratePlanId;
  final String propertyName;
  final String roomTypeName;
  final double basePrice;
  final String checkin;
  final String checkout;
  final int adults;
  final int children;
  final Map<String, dynamic> guestDetails;

  const PaymentPage({
    super.key,
    required this.cubit,
    required this.holdId,
    required this.ratePlanId,
    required this.propertyName,
    required this.roomTypeName,
    required this.basePrice,
    required this.checkin,
    required this.checkout,
    required this.adults,
    required this.children,
    required this.guestDetails,
  });

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  final _formKey = GlobalKey<FormState>();
  final _cardholderCtrl = TextEditingController();
  final _cardNumberCtrl = TextEditingController();
  final _expiryCtrl = TextEditingController();
  final _cvcCtrl = TextEditingController();

  @override
  void dispose() {
    _cardholderCtrl.dispose();
    _cardNumberCtrl.dispose();
    _expiryCtrl.dispose();
    _cvcCtrl.dispose();
    super.dispose();
  }

  int get _nights => du.nightsBetween(
        DateTime.parse(widget.checkin),
        DateTime.parse(widget.checkout),
      );

  double get _totalPrice => widget.basePrice * _nights;

  void _onPay() {
    if (!_formKey.currentState!.validate()) return;
    // Dismiss keyboard before processing payment
    FocusScope.of(context).unfocus();
    final rawCard = _cardNumberCtrl.text.replaceAll(' ', '');
    widget.cubit.submitBooking(
      holdId: widget.holdId,
      ratePlanId: widget.ratePlanId,
      adults: widget.adults,
      children: widget.children,
      guestDetails: widget.guestDetails,
      payment: {
        'cardholderName': _cardholderCtrl.text.trim(),
        'cardNumber': rawCard,
        'expiry': _expiryCtrl.text.trim(),
        'cvc': _cvcCtrl.text.trim(),
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider<CheckoutCubit>.value(
      value: widget.cubit,
      child: BlocConsumer<CheckoutCubit, CheckoutState>(
        listener: (context, state) {
          if (state is BookingSuccess) {
            context.pushNamed('confirmation', extra: {
              'booking': state.booking,
              'propertyName': widget.propertyName,
              'roomTypeName': widget.roomTypeName,
            });
          } else if (state is CheckoutError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger,
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is BookingLoading;
          return Scaffold(
            backgroundColor: AppColors.background,
            appBar: AppBar(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: const Text(
                'Payment',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
            body: GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              behavior: HitTestBehavior.opaque,
              child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPriceSummary(),
                  const SizedBox(height: 20),
                  const Text(
                    'Card details',
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
                        _field(_cardholderCtrl, 'Cardholder name',
                            required: true),
                        const SizedBox(height: 12),
                        _cardNumberField(),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: _expiryField()),
                            const SizedBox(width: 12),
                            Expanded(child: _cvcField()),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: const [
                      Icon(Icons.lock_outline, size: 13, color: AppColors.muted),
                      SizedBox(width: 4),
                      Text(
                        'Secure payment — test mode only',
                        style: TextStyle(fontSize: 11, color: AppColors.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _onPay,
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
                      child: isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white),
                              ),
                            )
                          : Text('Pay ${formatInr(_totalPrice)}'),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPriceSummary() {
    final nights = _nights;
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
          const SizedBox(height: 2),
          Text(widget.roomTypeName,
              style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          const Divider(height: 20, color: AppColors.border),
          _priceRow(
              '${formatInr(widget.basePrice)} × ${du.formatNights(nights)}',
              formatInr(_totalPrice)),
          const SizedBox(height: 6),
          _priceRow('Taxes & fees', 'Included'),
          const Divider(height: 16, color: AppColors.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text),
              ),
              Text(
                formatInr(_totalPrice),
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, String value) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 13, color: AppColors.muted)),
          Text(value,
              style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text)),
        ],
      );

  Widget _field(TextEditingController ctrl, String label,
      {bool required = false}) {
    return TextFormField(
      controller: ctrl,
      decoration: _inputDecoration(label),
      validator: required
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
    );
  }

  Widget _cardNumberField() {
    return TextFormField(
      controller: _cardNumberCtrl,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        _CardNumberFormatter(),
      ],
      maxLength: 19,
      decoration: _inputDecoration('Card number').copyWith(
        counterText: '',
        suffixIcon: const Icon(Icons.credit_card, color: AppColors.muted),
      ),
      validator: (v) {
        final digits = v?.replaceAll(' ', '') ?? '';
        if (digits.length != 16) return 'Enter a valid 16-digit card number';
        return null;
      },
    );
  }

  Widget _expiryField() {
    return TextFormField(
      controller: _expiryCtrl,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        _ExpiryFormatter(),
      ],
      maxLength: 5,
      decoration: _inputDecoration('MM/YY').copyWith(counterText: ''),
      validator: (v) {
        if (v == null || v.length != 5) return 'Invalid expiry';
        return null;
      },
    );
  }

  Widget _cvcField() {
    return TextFormField(
      controller: _cvcCtrl,
      keyboardType: TextInputType.number,
      obscureText: true,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      maxLength: 3,
      decoration: _inputDecoration('CVC').copyWith(
        counterText: '',
        suffixIcon: const Icon(Icons.help_outline, size: 18, color: AppColors.muted),
      ),
      validator: (v) {
        if (v == null || v.length != 3) return 'Invalid CVC';
        return null;
      },
    );
  }

  InputDecoration _inputDecoration(String label) => InputDecoration(
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
      );
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final formatted = buffer.toString();
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll('/', '');
    if (digits.length <= 2) {
      return newValue.copyWith(text: digits);
    }
    final formatted = '${digits.substring(0, 2)}/${digits.substring(2)}';
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
