import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../api/bookings.api';
import { BookingListItem } from '../../types';
import { formatDate, formatPrice } from '../../utils/format';
import { getApiError } from '../../utils/error';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import Badge from '../../components/ui/Badge';

type Tab = 'past' | 'cancelled';

function classifyBooking(b: BookingListItem): Tab {
  if (b.status === 'CANCELLED') return 'cancelled';
  return 'past';
}

const TAB_LABELS: Record<Tab, string> = {
  past:      'Past',
  cancelled: 'Cancelled',
};

export default function TripsPage() {
  const navigate    = useNavigate();
  const [activeTab, setActiveTab]     = useState<Tab>('past');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn:  () => bookingsApi.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled');
      setConfirmingId(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      setActiveTab('cancelled');
    },
    onError: (err) => {
      setConfirmingId(null);
      toast.error(getApiError(err));
    },
  });

  const allBookings: BookingListItem[] = data?.data ?? [];
  const tabBookings = allBookings.filter(b => classifyBooking(b) === activeTab);

  const counts: Record<Tab, number> = {
    past:      allBookings.filter(b => classifyBooking(b) === 'past').length,
    cancelled: allBookings.filter(b => classifyBooking(b) === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Stay Booked</h1>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {(Object.keys(TAB_LABELS) as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2.5 text-sm font-medium transition-colors relative',
                activeTab === tab
                  ? 'text-[#003580] border-b-2 border-[#003580] -mb-px'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {TAB_LABELS[tab]}
              {counts[tab] > 0 && (
                <span className={[
                  'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab
                    ? 'bg-blue-100 text-[#003580]'
                    : 'bg-gray-100 text-gray-500',
                ].join(' ')}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}
        {isError && <ErrorBanner message={getApiError(error)} />}

        {!isLoading && !isError && tabBookings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-2">
              {activeTab === 'past' ? 'No past bookings yet.' : 'No cancelled bookings.'}
            </p>
            {activeTab === 'past' && (
              <a href="/" className="text-sm text-[#003580] hover:underline">
                Start searching →
              </a>
            )}
          </div>
        )}

        {tabBookings.length > 0 && (
          <div className="space-y-4">
            {tabBookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                confirming={confirmingId === b.id}
                cancelling={cancelMutation.isPending && cancelMutation.variables === b.id}
                onView={() => navigate(`/trips/${b.id}`, { state: { booking: b } })}
                onRequestCancel={() => setConfirmingId(b.id)}
                onConfirmCancel={() => cancelMutation.mutate(b.id)}
                onDismissCancel={() => setConfirmingId(null)}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </div>
  );
}

function BookingCard({
  booking,
  confirming,
  cancelling,
  onView,
  onRequestCancel,
  onConfirmCancel,
  onDismissCancel,
}: {
  booking:         BookingListItem;
  confirming:      boolean;
  cancelling:      boolean;
  onView:          () => void;
  onRequestCancel: () => void;
  onConfirmCancel: () => void;
  onDismissCancel: () => void;
}) {
  const isCancellable = booking.status === 'CONFIRMED';

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-gray-900">{booking.property.name}</h3>
            <Badge status={booking.status} />
          </div>
          <p className="text-sm text-gray-500">{booking.property.city}</p>
          <p className="text-sm text-gray-500">{booking.roomType.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gray-900">
            {formatPrice(Number(booking.totalPrice))}
          </p>
          <p className="text-xs text-gray-400">total</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {([
          ['Check-in',        formatDate(booking.checkin)],
          ['Check-out',       formatDate(booking.checkout)],
          ['Confirmation #',  booking.confirmationNumber],
          ['PIN',             booking.pin],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label}>
            <dt className="text-gray-400 text-xs">{label}</dt>
            <dd className="font-medium text-gray-900 font-mono tracking-wide">{value}</dd>
          </div>
        ))}
      </dl>

      {isCancellable && !confirming && (
        <div className="mt-4 flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="danger" size="sm" onClick={onRequestCancel}>
            Cancel booking
          </Button>
        </div>
      )}

      {isCancellable && confirming && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-red-800 mb-3">
            Are you sure you want to cancel this trip?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onDismissCancel} disabled={cancelling}>
              No, keep it
            </Button>
            <Button variant="danger" size="sm" loading={cancelling} onClick={onConfirmCancel}>
              Yes, cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
