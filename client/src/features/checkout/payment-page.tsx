import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../api/bookings.api';
import { paymentsApi } from '../../api/payments.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { getApiError, getApiErrorCode } from '../../utils/error';
import { formatPrice, formatDate, formatNights } from '../../utils/format';
import { RazorpayOrder } from '../../types';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal: { ondismiss: () => void };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => any;
  }
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { roomSelection, guestDetails, clear } = useCheckoutStore();
  const bookingSucceeded = useRef(false);
  const rzpScriptLoaded = useRef(false);

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);

  // Load Razorpay checkout script once on mount
  useEffect(() => {
    if (rzpScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      rzpScriptLoaded.current = true;
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (!roomSelection || !guestDetails) {
    if (!bookingSucceeded.current) navigate('/');
    return null;
  }

  const { holdId, ratePlanId, adults, children, priceBreakdown } = roomSelection;
  const nights = formatNights(roomSelection.checkin, roomSelection.checkout);
  const roomCharge = priceBreakdown.basePrice;
  const gst = Math.round(roomCharge * 0.18 * 100) / 100;
  const displayTotal = roomCharge + gst;

  const openRazorpayPopup = (orderData: RazorpayOrder) => {
    if (!window.Razorpay) {
      toast.error('Payment system not loaded. Please refresh and try again.');
      return;
    }

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'StayBook',
      description: `Stay: ${formatDate(roomSelection.checkin)} – ${formatDate(roomSelection.checkout)}`,
      order_id: orderData.orderId,
      prefill: {
        name: `${guestDetails.firstName} ${guestDetails.lastName}`,
        email: guestDetails.email,
        contact: guestDetails.phone,
      },
      notes: { holdId: holdId ?? '' },
      theme: { color: '#003580' },
      handler: (response: RazorpayHandlerResponse) => {
        setPaymentError(null);
        setIsConfirmingBooking(true);
        confirmBookingMutation.mutate(response);
      },
      modal: {
        ondismiss: () => {
          setPaymentError('Payment was cancelled. Click "Pay Now" to try again.');
          setIsConfirmingBooking(false);
        },
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new window.Razorpay(options) as any;
    rzp.open();
  };

  // Phase 1: create Razorpay order
  const createOrderMutation = useMutation({
    mutationFn: () =>
      paymentsApi.createOrder({
        amount: displayTotal,
        holdId: holdId!,
      }),
    onSuccess: (res) => {
      setPaymentError(null);
      openRazorpayPopup(res.data);
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'HOLD_EXPIRED' || code === 'NOT_FOUND') {
        toast.error('Your booking hold has expired. Please search again.', { duration: 6000 });
        clear();
        navigate('/');
        return;
      }
      setPaymentError(getApiError(err));
    },
  });

  // Phase 2: confirm booking after Razorpay callback
  const confirmBookingMutation = useMutation({
    mutationFn: (rzpResponse: RazorpayHandlerResponse) =>
      bookingsApi.createBooking({
        holdId: holdId!,
        ratePlanId: ratePlanId || undefined,
        adults,
        children,
        guestDetails: {
          firstName: guestDetails.firstName,
          lastName: guestDetails.lastName,
          email: guestDetails.email,
          phone: guestDetails.phone,
          country: guestDetails.country,
          specialRequests: guestDetails.specialRequests,
          arrivalTime: guestDetails.arrivalTime,
        },
        payment: {
          razorpayOrderId: rzpResponse.razorpay_order_id,
          razorpayPaymentId: rzpResponse.razorpay_payment_id,
          razorpaySignature: rzpResponse.razorpay_signature,
        },
      }),
    onSuccess: (res) => {
      bookingSucceeded.current = true;
      setIsConfirmingBooking(false);
      clear();
      navigate(`/trips/${res.data.id}?confirmed=true`);
    },
    onError: (err) => {
      setIsConfirmingBooking(false);
      const code = getApiErrorCode(err);
      if (code === 'HOLD_EXPIRED' || code === 'NOT_FOUND') {
        toast.error('Your booking hold has expired. Please search again.', { duration: 6000 });
        clear();
        navigate('/');
        return;
      }
      if (code === 'PAYMENT_DECLINED') {
        setPaymentError(
          'Payment verification failed. Please contact support with your payment reference.',
        );
      } else {
        setPaymentError(getApiError(err));
      }
    },
  });

  const isLoading = createOrderMutation.isPending || isConfirmingBooking;

  const handlePayNow = () => {
    setPaymentError(null);
    createOrderMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Payment section */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment</h1>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {paymentError && (
                <div className="mb-4">
                  <ErrorBanner message={paymentError} />
                </div>
              )}

              {/* Secure payment badge */}
              <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
                <span className="text-lg">🔒</span>
                <span>Secure payment powered by Razorpay</span>
              </div>

              {/* What the user will be charged */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mb-6">
                <p className="text-sm text-blue-800">
                  You will be charged{' '}
                  <span className="font-bold">{formatPrice(displayTotal)}</span> for your{' '}
                  {nights} night{nights !== 1 ? 's' : ''} stay.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  A Razorpay payment popup will open where you can pay via UPI, card, or net
                  banking.
                </p>
              </div>

              {/* Agreement */}
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                By completing this booking you agree to our Booking Conditions, General Terms,
                Privacy Policy, and applicable payment terms.
              </p>

              <Button
                type="button"
                className="w-full"
                loading={isLoading}
                onClick={handlePayNow}
                disabled={isLoading}
              >
                {isLoading
                  ? isConfirmingBooking
                    ? 'Confirming booking...'
                    : 'Opening payment...'
                  : `🔒 Pay Now · ${formatPrice(displayTotal)}`}
              </Button>
            </div>
          </div>

          {/* Price summary sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Price summary</h3>
              <dl className="space-y-2 text-sm mb-4">
                {([
                  ['Check-in', formatDate(roomSelection.checkin)],
                  ['Check-out', formatDate(roomSelection.checkout)],
                  [
                    'Guests',
                    `${adults} adult${adults !== 1 ? 's' : ''}${
                      children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''
                    }`,
                  ],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">
                    Room charge ({nights} night{nights !== 1 ? 's' : ''})
                  </dt>
                  <dd className="font-medium text-gray-900">{formatPrice(roomCharge)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">GST (18%)</dt>
                  <dd className="font-medium text-gray-900">{formatPrice(gst)}</dd>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-base">
                  <dt className="text-gray-900">Total</dt>
                  <dd className="text-[#003580]">{formatPrice(displayTotal)}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
