import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { getApiError } from '../../utils/error';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';

const schema = z.object({
  firstName: z.string().min(1, 'First name required').trim(),
  lastName: z.string().min(1, 'Last name required').trim(),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a digit'),
});
type FormData = z.infer<typeof schema>;

type AccountType = 'CUSTOMER' | 'PARTNER';

const ACCOUNT_TYPES: { value: AccountType; label: string; desc: string; icon: string }[] = [
  { value: 'CUSTOMER', label: 'I am a traveller',    desc: 'Book hotels, resorts, and stays across India',  icon: '🧳' },
  { value: 'PARTNER',  label: 'I am a property host', desc: 'List and manage your properties on StayBook', icon: '🏨' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<AccountType>('CUSTOMER');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.register({ ...data, role }),
    onSuccess: (res) => {
      toast.success('Account created! Check your email for the verification code.');
      navigate(`/verify-otp?userId=${res.data.userId}`, { state: { devOtp: res.data.devOtp } });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f6fa] px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-[#003580] font-extrabold text-2xl tracking-tight">StayBook</span>
            <span className="text-[#FFCC00] text-2xl font-extrabold">.</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">Join millions of travellers on StayBook</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              I want to…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ACCOUNT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setRole(type.value)}
                  className={`flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all ${
                    role === type.value
                      ? 'border-[#003580] bg-blue-50 text-[#003580]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1.5">{type.icon}</span>
                  <span className="text-xs font-bold leading-snug">{type.label}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 leading-snug">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {mutation.isError && <ErrorBanner message={getApiError(mutation.error)} />}
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 chars, uppercase + digit"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={mutation.isPending} className="w-full">
              Create{role === 'PARTNER' ? ' partner' : ''} account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-[#003580] hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
