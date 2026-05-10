import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../api/bookings.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { getApiError, getApiErrorCode } from '../../utils/error';
import { formatPrice, formatDate, formatNights } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';

const schema = z.object({
  cardholderName: z.string().min(2, 'Cardholder name required'),
  cardNumber: z.string().regex(/^\d{16}$/, 'Enter 16-digit card number'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, 'Enter 3 or 4-digit CVC'),
});
type FormData = z.infer<typeof schema>;

const TEST_CARD = {
  cardholderName: 'Test User',
  cardNumber: '4532123456789012',
  expiry: '12/26',
  cvc: '123',
} as const;

function formatCardDisplay(raw: string): string {
  return raw.replace(/(.{4})/g, '$1 ').trim();
}

function detectCardBrand(first: string): { label: string; color: string } | null {
  if (!first) return null;
  if (first === '4') return { label: 'Visa', color: 'bg-blue-100 text-blue-700' };
  if (first === '5') return { label: 'Mastercard', color: 'bg-orange-100 text-orange-700' };
  if (first === '3') return { label: 'Amex', color: 'bg-green-100 text-green-700' };
  return null;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const { roomSelection, guestDetails, clear } = useCheckoutStore();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const bookingSucceeded = useRef(false);

  const cardholderDefault = guestDetails
    ? `${guestDetails.firstName} ${guestDetails.lastName}`
    : '';

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      cardholderName: cardholderDefault,
      cardNumber: '',
      expiry: '',
      cvc: '',
    },
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      setValue('cardholderName', cardholderDefault || TEST_CARD.cardholderName);
      setValue('cardNumber', TEST_CARD.cardNumber);
      setValue('expiry', TEST_CARD.expiry);
      setValue('cvc', TEST_CARD.cvc);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardNumberRaw = watch('cardNumber') ?? '';
  const expiryVal     = watch('expiry') ?? '';
  const brand = detectCardBrand(cardNumberRaw[0] ?? '');

  if (!roomSelection || !guestDetails) {
    if (!bookingSucceeded.current) navigate('/');
    return null;
  }

  const { holdId, ratePlanId, adults, children, priceBreakdown } = roomSelection;
  const nights     = formatNights(roomSelection.checkin, roomSelection.checkout);
  const roomCharge = priceBreakdown.basePrice;
  const gst        = Math.round(roomCharge * 0.18 * 100) / 100;
  const displayTotal = roomCharge + gst;

  const fillTestCard = () => {
    setValue('cardholderName', TEST_CARD.cardholderName, { shouldValidate: true });
    setValue('cardNumber',     TEST_CARD.cardNumber,     { shouldValidate: true });
    setValue('expiry',         TEST_CARD.expiry,         { shouldValidate: true });
    setValue('cvc',            TEST_CARD.cvc,            { shouldValidate: true });
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setValue('cardNumber', raw, { shouldValidate: true });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length === 2 && e.target.value.length > expiryVal.length) {
      formatted = `${digits}/`;
    }
    setValue('expiry', formatted, { shouldValidate: true });
  };

  const mutation = useMutation({
    mutationFn: (payment: FormData) =>
      bookingsApi.createBooking({
        holdId: holdId!,
        ratePlanId: ratePlanId || undefined,
        adults,
        children,
        guestDetails: {
          firstName:       guestDetails.firstName,
          lastName:        guestDetails.lastName,
          email:           guestDetails.email,
          phone:           guestDetails.phone,
          country:         guestDetails.country,
          specialRequests: guestDetails.specialRequests,
          arrivalTime:     guestDetails.arrivalTime,
        },
        payment: { ...payment, simulateFailure },
      }),
    onSuccess: (res) => {
      bookingSucceeded.current = true;
      clear();
      navigate(`/trips/${res.data.id}?confirmed=true`);
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'HOLD_EXPIRED' || code === 'NOT_FOUND') {
        toast.error('Your booking hold has expired. Please search again.', { duration: 6000 });
        clear();
        navigate('/');
        return;
      }
      toast.error(getApiError(err), { duration: 5000 });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Payment form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment</h1>

            {/* DEV — test card helper */}
            {import.meta.env.DEV && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                      DEV — Test card (auto-filled)
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-amber-800 font-mono">
                      <span className="text-amber-600">Name</span>
                      <span>{TEST_CARD.cardholderName}</span>
                      <span className="text-amber-600">Number</span>
                      <span>{formatCardDisplay(TEST_CARD.cardNumber)}</span>
                      <span className="text-amber-600">Expiry</span>
                      <span>{TEST_CARD.expiry}</span>
                      <span className="text-amber-600">CVC</span>
                      <span>{TEST_CARD.cvc}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fillTestCard}
                    className="shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
                  >
                    Re-fill ↗
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {mutation.isError && (
                <ErrorBanner message={getApiError(mutation.error)} />
              )}

              <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                <Input
                  label="Cardholder name"
                  placeholder="Jane Smith"
                  error={errors.cardholderName?.message}
                  {...register('cardholderName')}
                />

                {/* Card number with brand detection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Card number</label>
                    {brand && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${brand.color}`}>
                        {brand.label}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={formatCardDisplay(cardNumberRaw)}
                    onChange={handleCardNumberChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono tracking-wider focus:outline-none transition-colors ${
                      errors.cardNumber
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#003580]'
                    }`}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Expiry */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiryVal}
                      onChange={handleExpiryChange}
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none transition-colors ${
                        errors.expiry
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#003580]'
                      }`}
                    />
                    {errors.expiry && (
                      <p className="mt-1 text-xs text-red-500">{errors.expiry.message}</p>
                    )}
                  </div>

                  <Input
                    label="CVC"
                    placeholder="123"
                    maxLength={4}
                    inputMode="numeric"
                    error={errors.cvc?.message}
                    {...register('cvc')}
                  />
                </div>

                {import.meta.env.DEV && (
                  <label className="flex items-center gap-2 text-sm text-orange-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="rounded"
                    />
                    [DEV] Simulate payment failure
                  </label>
                )}

                {/* Agreement */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  By completing this booking you agree to our Booking Conditions, General Terms,
                  Privacy Policy, and applicable payment terms.
                </p>

                <Button
                  type="submit"
                  className="w-full"
                  loading={mutation.isPending}
                >
                  🔒 Complete booking · {formatPrice(priceBreakdown.total)}
                </Button>
              </form>
            </div>
          </div>

          {/* Price summary sidebar */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Price summary</h3>

              {/* Meta info */}
              <dl className="space-y-2 text-sm mb-4">
                {([
                  ['Check-in',  formatDate(roomSelection.checkin)],
                  ['Check-out', formatDate(roomSelection.checkout)],
                  ['Guests',    `${adults} adult${adults !== 1 ? 's' : ''}${children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}`],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* Price breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Room charge ({nights} night{nights !== 1 ? 's' : ''})</dt>
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
