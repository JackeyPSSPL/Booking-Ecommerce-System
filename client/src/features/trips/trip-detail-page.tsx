import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '../../api/bookings.api';
import { BookingListItem } from '../../types';
import { formatDate, formatPrice, formatNights } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/ui/Spinner';

const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: fixed; top: -10px; width: 8px; height: 14px; border-radius: 2px;
  animation: confetti-fall linear forwards;
  pointer-events: none; z-index: 9999;
}
`;
const COLORS = ['#003580', '#FFCC00', '#00875A', '#D32F2F', '#9C27B0', '#FF9800'];

function spawnConfetti() {
  const style = document.createElement('style');
  style.textContent = CONFETTI_CSS;
  document.head.appendChild(style);
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.animationDuration = `${2 + Math.random() * 2}s`;
    el.style.animationDelay = `${Math.random() * 1.5}s`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function CopyButton({ value }: { value: string }) {
  const copy = () => { navigator.clipboard.writeText(value).catch(() => undefined); };
  return (
    <button
      onClick={copy}
      title="Copy"
      className="ml-2 text-gray-400 hover:text-[#003580] transition-colors"
    >
      <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}

const STATUS_CONFIG: Record<string, { label: string; headline: string; color: string; bg: string; border: string }> = {
  CONFIRMED: { label: 'Confirmed', headline: 'Your booking is confirmed',         color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  CANCELLED: { label: 'Cancelled', headline: 'This booking has been cancelled',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200'   },
  COMPLETED: { label: 'Completed', headline: 'Your stay has been completed',      color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  NO_SHOW:   { label: 'No Show',   headline: 'This booking was marked as no-show',color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200'},
};

export default function TripDetailPage() {
  const { bookingId }  = useParams<{ bookingId: string }>();
  const location       = useLocation();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewBooking   = searchParams.get('confirmed') === 'true';
  const confettiFired  = useRef(false);

  const stateBooking = location.state?.booking as BookingListItem | undefined;
  const hasFullData  = !!stateBooking?.property;

  const { data: listData, isLoading } = useQuery({
    queryKey: ['my-bookings-detail', bookingId],
    queryFn:  () => bookingsApi.getMyBookings({ limit: 50 }),
    enabled:  !hasFullData,
  });

  const booking: BookingListItem | undefined = hasFullData
    ? stateBooking
    : listData?.data?.find((b: BookingListItem) => b.id === bookingId);

  useEffect(() => {
    if (isNewBooking && booking && !confettiFired.current) {
      confettiFired.current = true;
      spawnConfetti();
    }
  }, [isNewBooking, booking]);

  if (!hasFullData && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageWrapper>
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        </PageWrapper>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageWrapper>
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">Booking not found.</p>
            <Link to="/trips" className="text-[#003580] hover:underline text-sm">← Back to My Stay Booked</Link>
          </div>
        </PageWrapper>
      </div>
    );
  }

  const status   = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.CONFIRMED;
  const nights   = formatNights(booking.checkin, booking.checkout);
  const guestStr = [
    `${booking.adults} adult${booking.adults !== 1 ? 's' : ''}`,
    booking.children ? `${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Print styles */}
      <style>{`@media print { header, .no-print { display: none !important; } body { background: white; } }`}</style>

      <PageWrapper>
        {/* Back link — hidden when arriving directly from payment */}
        {!isNewBooking && (
          <button
            onClick={() => navigate('/trips')}
            className="flex items-center gap-1.5 text-sm text-[#003580] hover:underline mb-5 no-print"
          >
            ← My Stay Booked
          </button>
        )}

        {/* ── NEW BOOKING: Hero confirmation banner ──────────────────── */}
        {isNewBooking ? (
          <>
            {/* Hero */}
            <div className="mb-6 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Check circle */}
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-md">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Payment successful</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                  <p className="text-sm text-gray-500">
                    A confirmation has been sent to <span className="font-medium text-gray-700">{booking.guestName}</span>
                  </p>
                </div>
                {/* Numbers */}
                <div className="flex flex-col gap-2 shrink-0 min-w-[180px] bg-white rounded-xl border border-green-200 px-4 py-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Confirmation #</p>
                    <div className="flex items-center">
                      <span className="font-bold font-mono tracking-wide text-gray-900 text-sm">
                        {booking.confirmationNumber}
                      </span>
                      <CopyButton value={booking.confirmationNumber} />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-400 mb-0.5">PIN code</p>
                    <div className="flex items-center">
                      <span className="font-bold font-mono tracking-widest text-xl text-[#003580]">
                        {booking.pin}
                      </span>
                      <CopyButton value={booking.pin} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {/* Left — property + price */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{booking.property.name}</h2>
                  <p className="text-sm text-gray-500 mb-5">📍 {booking.property.city}</p>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                      <p className="font-bold text-gray-900 text-base">{formatDate(booking.checkin)}</p>
                      <p className="text-xs text-gray-400">from 14:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Check-out</p>
                      <p className="font-bold text-gray-900 text-base">{formatDate(booking.checkout)}</p>
                      <p className="text-xs text-gray-400">until 12:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Guests</p>
                      <p className="font-medium text-gray-900">{guestStr}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Room</p>
                      <p className="font-medium text-gray-900">{booking.roomType.name}</p>
                      <p className="text-xs text-gray-400">{nights} night{nights !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Guest name</p>
                      <p className="font-medium text-gray-900">{booking.guestName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Booked on</p>
                      <p className="font-medium text-gray-900">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total paid (incl. taxes)</span>
                    <span className="text-2xl font-bold text-[#003580]">
                      {formatPrice(Number(booking.totalPrice))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right — actions */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2 no-print">
                  <Link
                    to="/trips"
                    className="flex items-center justify-center gap-2 w-full text-sm font-semibold text-white bg-[#003580] hover:bg-[#00224F] rounded-lg py-2.5 transition-colors"
                  >
                    Manage my booking
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="w-full text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg py-2.5 transition-colors"
                  >
                    🖨 Save as PDF
                  </button>
                  <Link
                    to={`/property/${booking.property.id}`}
                    className="block w-full text-center text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg py-2.5 transition-colors"
                  >
                    View property
                  </Link>
                  <Link
                    to="/"
                    className="block w-full text-center text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg py-2.5 transition-colors"
                  >
                    🔍 Find another place
                  </Link>
                </div>
              </div>
            </div>

            {/* What's next */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-6 no-print">
              <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">What's next?</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  ['🪪', 'Carry a valid photo ID at check-in — your PIN may be required.'],
                  ['⏰', 'Standard check-in is 2:00 PM. Early check-in subject to availability.'],
                  ['📞', 'Need to change your booking? Visit My Stay Booked or contact the property directly.'],
                  ['✉️', 'A confirmation email with all details has been sent to the guest.'],
                ].map(([icon, text]) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="text-base shrink-0">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          /* ── STANDARD VIEW (from trips list) ─────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-4">

              {/* Status banner */}
              <div className={`rounded-xl border ${status.border} ${status.bg} p-5`}>
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${status.color}`}>
                  {status.label}
                </p>
                <h1 className={`text-xl font-bold ${status.color}`}>{status.headline}</h1>
                <div className="mt-3 flex gap-4 text-sm">
                  {booking.status !== 'CANCELLED' ? (
                    <>
                      <Link to={`/property/${booking.property.id}`} className="text-[#003580] hover:underline font-medium">
                        🏨 View property
                      </Link>
                      <Link to="/" className="text-[#003580] hover:underline font-medium">
                        🔍 Find another place
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to={`/property/${booking.property.id}`} className="text-[#003580] hover:underline font-medium">
                        🔄 Book again
                      </Link>
                      <Link to="/" className="text-[#003580] hover:underline font-medium">
                        🔍 Find another place
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Property details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-5">{booking.property.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {([
                    ['📅', 'Check-in',       formatDate(booking.checkin),  'from 14:00'],
                    ['📅', 'Check-out',      formatDate(booking.checkout), 'until 12:00'],
                    ['📋', 'Booking details', guestStr,                    `${nights} night${nights !== 1 ? 's' : ''} · ${booking.roomType.name}`],
                    ['👤', 'Guest name',      booking.guestName,            null],
                  ] as [string, string, string, string | null][]).map(([icon, label, value, sub]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="font-medium text-gray-900">{value}</p>
                        {sub && <p className="text-xs text-gray-500">{sub}</p>}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 sm:col-span-2">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Location</p>
                      <p className="font-medium text-gray-900">{booking.property.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Price summary</h3>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-500">{nights} night{nights !== 1 ? 's' : ''} × room rate</span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                  <span className="font-semibold text-gray-900">Total paid</span>
                  <span className="text-xl font-bold text-[#003580]">
                    {formatPrice(Number(booking.totalPrice))}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Includes all taxes and fees</p>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-1">Confirmation number</p>
                  <div className="flex items-center">
                    <span className="font-bold text-gray-900 font-mono tracking-wide">{booking.confirmationNumber}</span>
                    <CopyButton value={booking.confirmationNumber} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">PIN code</p>
                  <div className="flex items-center">
                    <span className="font-bold text-gray-900 font-mono tracking-widest text-lg">{booking.pin}</span>
                    <CopyButton value={booking.pin} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-400 mb-1">Booked on</p>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
                <button
                  onClick={() => window.print()}
                  className="block w-full text-center text-sm font-medium text-[#003580] hover:bg-blue-50 border border-[#003580] rounded-lg py-2 transition-colors"
                >
                  🖨 Save as PDF
                </button>
                <Link
                  to={`/property/${booking.property.id}`}
                  className="block w-full text-center text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg py-2 transition-colors"
                >
                  View property
                </Link>
                <Link
                  to="/trips"
                  className="block w-full text-center text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg py-2 transition-colors"
                >
                  Back to my bookings
                </Link>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
