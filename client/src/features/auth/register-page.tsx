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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.register(data),
    onSuccess: (res) => {
      toast.success('Account created! Check your email for the verification code.');
      navigate(`/verify-otp?userId=${res.data.userId}`, { state: { devOtp: res.data.devOtp } });
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Start planning your next trip</p>
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
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
