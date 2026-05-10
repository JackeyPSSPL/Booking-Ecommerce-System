import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from '../../api/auth.api';

const CATEGORIES = [
  { label: 'Stays',          icon: '🛏',  to: '/',    active: true  },
  { label: 'Flights',        icon: '✈',   to: null,   active: false },
  { label: 'Flight + Hotel', icon: '🏨',  to: null,   active: false },
  { label: 'Car rental',     icon: '🚗',  to: null,   active: false },
  { label: 'Attractions',    icon: '🎡',  to: null,   active: false },
];

export default function Header() {
  const { user, accessToken, clear } = useAuthStore();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);
  const dropRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try { await authApi.logout(); } catch { /* ignore */ }
    clear();
    navigate('/login');
    toast.success('Signed out');
  };

  const isPartner = user?.role === 'PARTNER';
  const isAdmin   = user?.role === 'ADMIN';
  const isOnStays = location.pathname === '/';

  return (
    <header className="sticky top-0 z-30" style={{ background: '#003580' }}>
      {/* ── Row 1 — Utility bar ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-white font-extrabold text-xl tracking-tight">StayBook</span>
          <span className="text-[#FFCC00] text-xl font-extrabold">.</span>
        </Link>

        {/* Right utility */}
        <div className="flex items-center gap-1">
          {/* Currency */}
          <button className="hidden sm:flex items-center gap-1.5 text-white/90 hover:bg-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors">
            <span>🇮🇳</span>
            <span className="font-medium">INR</span>
          </button>

          {/* Help */}
          <button
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full text-white/90 hover:bg-white/10 transition-colors text-sm font-bold border border-white/30"
            title="Help"
          >
            ?
          </button>

          {/* List property / Partner Dashboard */}
          {!isPartner && !isAdmin && (
            <Link
              to={accessToken ? '/partner/dashboard' : '/register'}
              className="hidden md:block text-white text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              List your property
            </Link>
          )}

          {/* Account */}
          {accessToken ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#FFCC00] flex items-center justify-center text-gray-900 font-bold text-sm shrink-0">
                  {user?.firstName?.[0] ?? user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-xs font-semibold leading-none">
                    {user?.firstName ?? 'Account'}
                  </p>
                  {isPartner && <p className="text-[#FFCC00] text-[10px] mt-0.5">Partner</p>}
                  {isAdmin   && <p className="text-red-300 text-[10px] mt-0.5">Admin</p>}
                </div>
                <span className="text-white/70 text-xs">▾</span>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user?.firstName ?? ''} {user?.lastName ?? ''}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <DropItem to="/trips"  label="📋 My Stay Booked"    onClick={() => setOpen(false)} />
                  {isPartner && (
                    <DropItem to="/partner/dashboard" label="🏠 Partner Dashboard" onClick={() => setOpen(false)} />
                  )}
                  {isAdmin && (
                    <DropItem to="/admin/dashboard" label="⚙️ Admin Panel" onClick={() => setOpen(false)} />
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Sign out →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/register"
                className="text-white text-sm font-medium hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/30"
              >
                Register
              </Link>
              <Link
                to="/login"
                className="text-[#003580] bg-white text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2 — Category tabs (customer only) ────────────────────── */}
      {!isPartner && !isAdmin && (
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(cat => (
              cat.to ? (
                <Link
                  key={cat.label}
                  to={cat.to}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                    isOnStays && cat.label === 'Stays'
                      ? 'border-white text-white'
                      : 'border-transparent text-white/75 hover:text-white hover:border-white/40'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </Link>
              ) : (
                <button
                  key={cat.label}
                  title="Coming soon"
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-white/40 cursor-not-allowed shrink-0"
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function DropItem({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {label}
    </Link>
  );
}
