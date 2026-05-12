import { useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CreatedBooking } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';

// CSS-only confetti — injected once on mount
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

const COLORS = ['#003580','#FFCC00','#00875A','#D32F2F','#9C27B0','#FF9800'];

function spawnConfetti() {
  const style = document.createElement('style');
  style.textContent = CONFETTI_CSS;
  document.head.appendChild(style);

  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left     = `${Math.random() * 100}vw`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.animationDuration  = `${2 + Math.random() * 2}s`;
    el.style.animationDelay     = `${Math.random() * 1.5}s`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

export default function ConfirmationPage() {
  const { bookingId }     = useParams<{ bookingId: string }>();
  const { state }         = useLocation() as { state: { booking: CreatedBooking } | null };
  const confettiFired     = useRef(false);

  const booking = state?.booking;

  useEffect(() => {
    if (booking && !confettiFired.current) {
      confettiFired.current = true;
      spawnConfetti();
    }
  }, [booking]);

  const handleCopy = () => {
    if (!booking) return;
    navigator.clipboard.writeText(booking.confirmationNumber).then(() => {
      // brief visual feedback via button text swap handled inline
    });
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <PageWrapper>
          <div className="max-w-lg mx-auto text-center py-16">
            <p className="text-gray-500 mb-4">
              Booking <strong>{bookingId}</strong> confirmed.
            </p>
            <Link to="/trips" className="text-primary-500 hover:underline text-sm">
              View my trips
            </Link>
          </div>
        </PageWrapper>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Print-only styles */}
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <PageWrapper>
        <div className="max-w-lg mx-auto">
          {/* Main card */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Booking Confirmed!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Confirmation sent to <strong>{booking.guestEmail}</strong>
            </p>

            {/* Booking details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-3">
              {/* Confirmation number with copy */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Confirmation #</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono tracking-wider font-medium text-gray-900">
                    {booking.confirmationNumber}
                  </span>
                  <button
                    onClick={handleCopy}
                    title="Copy confirmation number"
                    className="text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <InfoRow label="PIN" value={booking.pin} mono />
              <InfoRow label="Guest" value={booking.guestName} />
              <InfoRow label="Check-in" value={formatDate(booking.checkin)} />
              <InfoRow label="Check-out" value={formatDate(booking.checkout)} />
              <InfoRow
                label="Guests"
                value={`${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${
                  booking.children ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''
                }`}
              />
              <div className="border-t border-gray-200 pt-3">
                <InfoRow label="Total paid" value={formatPrice(Number(booking.totalPrice))} bold />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 no-print">
              <Link
                to="/trips"
                className="flex-1 text-center bg-primary-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                View my trips
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 text-center bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                🖨 Save as PDF
              </button>
              <Link
                to="/"
                className="flex-1 text-center bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Back to search
              </Link>
            </div>
          </div>

          {/* What's next */}
          <div className="mt-6 bg-blue-50 rounded-xl p-6 no-print">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm">What's next?</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span>🪪</span>
                <span>Carry a valid photo ID at check-in — your PIN may be required.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⏰</span>
                <span>Standard check-in is 2:00 PM. Early check-in subject to availability.</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📞</span>
                <span>Need to change your booking? Visit <strong>My Trips</strong> or contact the property directly.</span>
              </li>
            </ul>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={[
          'text-gray-900',
          mono ? 'font-mono tracking-wider' : '',
          bold ? 'font-bold text-base' : 'font-medium',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}
