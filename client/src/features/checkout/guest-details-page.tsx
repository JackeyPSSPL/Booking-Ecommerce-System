import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCheckoutStore } from '../../store/checkout.store';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(5, 'Phone required'),
  country: z.string().min(1, 'Country required'),
  arrivalTime: z.string().optional(),
  specialRequests: z.string().max(500, 'Max 500 characters').optional(),
});
type FormData = z.infer<typeof schema>;

const ARRIVAL_TIMES = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00',
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00',
];

export default function GuestDetailsPage() {
  const navigate = useNavigate();
  const { roomSelection, setGuestDetails } = useCheckoutStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!roomSelection) {
    navigate('/');
    return null;
  }

  const onSubmit = (data: FormData) => {
    setGuestDetails({ ...data, isMainGuest: true });
    navigate('/checkout/payment');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Guest details</h1>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First name"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <Input
                  label="Last name"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
              </div>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Phone"
                type="tel"
                placeholder="+1 555 000 0000"
                error={errors.phone?.message}
                {...register('phone')}
              />
              <Input
                label="Country"
                placeholder="United States"
                error={errors.country?.message}
                {...register('country')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated arrival time{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...register('arrivalTime')}
                >
                  <option value="">I don't know</option>
                  {ARRIVAL_TIMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special requests{' '}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Any special requests or notes for the property..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  {...register('specialRequests')}
                />
                {errors.specialRequests && (
                  <p className="text-xs text-red-600 mt-1">{errors.specialRequests.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Continue to payment
              </Button>
            </form>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
