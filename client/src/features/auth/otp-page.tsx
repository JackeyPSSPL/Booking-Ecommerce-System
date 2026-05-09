import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { getApiError } from '../../utils/error';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ErrorBanner from '../../components/ui/ErrorBanner';

const schema = z.object({
  code: z.string().length(6, 'Enter 6-digit code').regex(/^\d{6}$/, 'Numbers only'),
});
type FormData = z.infer<typeof schema>;

export default function OtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const userId = searchParams.get('userId') ?? '';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => authApi.verifyOtp(userId, data.code),
    onSuccess: (res) => {
      login(res.data.user, res.data.accessToken, '');
      toast.success('Email verified! Welcome.');
      navigate('/');
    },
  });

  if (!userId) {
    navigate('/register');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6 text-center">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-sm text-gray-500 mt-2">Enter the 6-digit code we sent to your email.</p>
          {import.meta.env.DEV && (
            <p className="mt-2 text-xs text-orange-500">[DEV] Check server logs for the OTP code</p>
          )}
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {mutation.isError && <ErrorBanner message={getApiError(mutation.error)} />}
          <Input
            label="Verification code"
            placeholder="123456"
            maxLength={6}
            error={errors.code?.message}
            {...register('code')}
          />
          <Button type="submit" loading={mutation.isPending} className="w-full">Verify</Button>
        </form>
      </div>
    </div>
  );
}
