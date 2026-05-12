import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { getApiError } from '../../utils/error';
import Button from '../../components/ui/Button';
import ErrorBanner from '../../components/ui/ErrorBanner';

const OTP_LENGTH  = 6;
const OTP_EXPIRY  = 10 * 60;  // 10 minutes in seconds

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const reset = () => setRemaining(seconds);
  const mm    = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss    = String(remaining % 60).padStart(2, '0');

  return { remaining, display: `${mm}:${ss}`, reset };
}

export default function OtpPage() {
  const [searchParams]         = useSearchParams();
  const navigate               = useNavigate();
  const { state }              = useLocation();
  const login                  = useAuthStore(s => s.login);
  const userId                 = searchParams.get('userId') ?? '';
  const devOtp                 = (state as { devOtp?: string } | null)?.devOtp;

  const [digits, setDigits]    = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs              = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const submitCalledRef        = useRef(false);
  const { remaining, display, reset } = useCountdown(OTP_EXPIRY);

  const mutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(userId, code),
    onSuccess: (res) => {
      login(res.data.user, res.data.accessToken, '');
      toast.success('Email verified! Welcome.');
      navigate('/');
    },
    onError: () => {
      submitCalledRef.current = false;
    },
  });

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH && !submitCalledRef.current && !mutation.isPending) {
      submitCalledRef.current = true;
      mutation.mutate(code);
    }
  }, [digits, mutation]);

  const handleChange = (index: number, value: string) => {
    // Accept paste of full code into first box
    if (value.length > 1) return;
    const digit = value.replace(/\D/, '');
    const next  = digits.slice();
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.slice();
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = () => {
    reset();
    submitCalledRef.current = false;
    setDigits(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    toast('New OTP sent — check server logs in dev mode.', { icon: '📧' });
  };

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
          <p className="text-sm text-gray-500 mt-2">
            Enter the 6-digit code we sent to your email.
          </p>
          {import.meta.env.DEV && devOtp && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm">
              <span className="text-amber-600 font-medium">DEV — your OTP: </span>
              <span className="font-mono font-bold text-amber-800 tracking-widest">{devOtp}</span>
            </div>
          )}
        </div>

        {mutation.isError && (
          <div className="mb-4">
            <ErrorBanner message={getApiError(mutation.error)} />
          </div>
        )}

        {/* 6-box OTP input */}
        <div className="flex justify-center gap-2 mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={[
                'w-11 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors',
                digit
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-900',
                'focus:border-primary-500 focus:ring-0',
              ].join(' ')}
            />
          ))}
        </div>

        <Button
          type="button"
          className="w-full"
          loading={mutation.isPending}
          onClick={() => {
            const code = digits.join('');
            if (code.length === OTP_LENGTH) mutation.mutate(code);
          }}
        >
          Verify
        </Button>

        {/* Countdown + resend */}
        <div className="mt-5 text-center text-sm">
          {remaining > 0 ? (
            <p className="text-gray-500">
              Code expires in{' '}
              <span className={remaining < 60 ? 'text-red-500 font-semibold' : 'font-medium'}>
                {display}
              </span>
            </p>
          ) : (
            <p className="text-gray-500">Code expired.</p>
          )}
          <button
            type="button"
            disabled={remaining > 0}
            onClick={handleResend}
            className={[
              'mt-2 text-sm font-medium transition-colors',
              remaining > 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-primary-500 hover:underline cursor-pointer',
            ].join(' ')}
          >
            Resend OTP
          </button>
        </div>
      </div>
    </div>
  );
}
