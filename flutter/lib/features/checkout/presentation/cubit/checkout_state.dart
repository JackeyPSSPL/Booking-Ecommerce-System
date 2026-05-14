part of 'checkout_cubit.dart';

abstract class CheckoutState extends Equatable {
  const CheckoutState();
}

class CheckoutInitial extends CheckoutState {
  const CheckoutInitial();
  @override
  List<Object?> get props => [];
}

class HoldLoading extends CheckoutState {
  const HoldLoading();
  @override
  List<Object?> get props => [];
}

class HoldReady extends CheckoutState {
  final String holdId;
  final DateTime expiresAt;
  const HoldReady({required this.holdId, required this.expiresAt});
  @override
  List<Object?> get props => [holdId, expiresAt];
}

class BookingLoading extends CheckoutState {
  const BookingLoading();
  @override
  List<Object?> get props => [];
}

class BookingSuccess extends CheckoutState {
  final BookingEntity booking;
  const BookingSuccess(this.booking);
  @override
  List<Object?> get props => [booking];
}

class CheckoutError extends CheckoutState {
  final String message;
  const CheckoutError(this.message);
  @override
  List<Object?> get props => [message];
}
