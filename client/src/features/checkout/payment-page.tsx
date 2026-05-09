import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../api/bookings.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { getApiError } from '../../utils/error';
import { formatPrice, formatDate, formatNights } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';

const schema = z.object({
  cardholderName: z.string().min(1, 'Cardholder name required'),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, 'Enter 16-digit card number (no spaces)'),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  cvc: z.string().regex(/^\d{3}$/, 'Enter 3-digit CVC'),
});
type FormData = z.infer<typeof schema>;

export default function PaymentPage() {
  const navigate = useNavigate();
  const { roomSelection, guestDetails, clear } = useCheckoutStore();
  const [simulateFailure, setSimulateFailure] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!roomSelection || !guestDetails) {
    navigate('/');
    return null;
  }

  const { holdId, ratePlanId, adults, children, priceBreakdown } = roomSelection;
  const nights = formatNights(roomSelection.checkin, roomSelection.checkout);

  const mutation = useMutation({
    mutationFn: (payment: FormData) =>
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
        payment: { ...payment, simulateFailure },
      }),
    onSuccess: (res) => {
      clear();
      navigate(`/booking/confirmation/${res.data.id}`, { state: { booking: res.data } });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Payment form */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment</h1>
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
                <Input
                  label="Card number"
                  placeholder="1234567890123456"
                  maxLength={16}
                  error={errors.cardNumber?.message}
                  {...register('cardNumber')}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry"
                    placeholder="MM/YY"
                    maxLength={5}
                    error={errors.expiry?.message}
                    {...register('expiry')}
                  />
                  <Input
                    label="CVC"
                    placeholder="123"
                    maxLength={3}
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

                <Button
                  type="submit"
                  className="w-full"
                  loading={mutation.isPending}
                >
                  Pay {formatPrice(priceBreakdown.total)}
                </Button>
              </form>
            </div>
          </div>

          {/* Price summary */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Price summary</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Check-in', formatDate(roomSelection.checkin)],
                  ['Check-out', formatDate(roomSelection.checkout)],
                  ['Nights', String(nights)],
                  ['Guests', `${adults} adult${adults !== 1 ? 's' : ''}${children ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-medium text-gray-900">{value}</dd>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-semibold">
                  <dt className="text-gray-900">Total</dt>
                  <dd className="text-primary-600">{formatPrice(priceBreakdown.total)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
