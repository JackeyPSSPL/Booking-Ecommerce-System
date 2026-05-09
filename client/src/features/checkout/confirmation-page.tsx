import { useParams, useLocation, Link } from 'react-router-dom';
import { CreatedBooking } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';

export default function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { state } = useLocation() as { state: { booking: CreatedBooking } | null };

  const booking = state?.booking;

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
      <PageWrapper>
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">You're all set!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Confirmation sent to <strong>{booking.guestEmail}</strong>
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-3">
              <InfoRow label="Confirmation #" value={booking.confirmationNumber} mono />
              <InfoRow label="PIN" value={booking.pin} mono />
              <InfoRow label="Guest" value={booking.guestName} />
              <InfoRow label="Check-in" value={formatDate(booking.checkin)} />
              <InfoRow label="Check-out" value={formatDate(booking.checkout)} />
              <InfoRow
                label="Guests"
                value={`${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}`}
              />
              <div className="border-t border-gray-200 pt-3">
                <InfoRow
                  label="Total paid"
                  value={formatPrice(Number(booking.totalPrice))}
                  bold
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/trips"
                className="flex-1 text-center bg-primary-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                View my trips
              </Link>
              <Link
                to="/"
                className="flex-1 text-center bg-gray-100 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Back to search
              </Link>
            </div>
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
