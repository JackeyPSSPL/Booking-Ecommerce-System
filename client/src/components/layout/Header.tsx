import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';
import Button from '../ui/Button';

export default function Header() {
  const { user, accessToken, clear } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    clear();
    navigate('/login');
    toast.success('Signed out');
  };

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-500">
          BookingMVP
        </Link>
        <nav className="flex items-center gap-3">
          {accessToken ? (
            <>
              <Link to="/trips" className="text-sm text-gray-600 hover:text-gray-900">
                My Trips
              </Link>
              {user?.role === 'PARTNER' && (
                <Link to="/partner/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              )}
              <span className="hidden sm:block text-sm text-gray-400">{user?.email}</span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
