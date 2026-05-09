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

export default function TripsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMyBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const bookings: BookingListItem[] = data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My trips</h1>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}
        {isError && <ErrorBanner message={getApiError(error)} />}

        {!isLoading && !isError && bookings.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400">No trips yet. Start planning your next stay!</p>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                cancelling={cancelMutation.isPending && cancelMutation.variables === b.id}
                onCancel={() => cancelMutation.mutate(b.id)}
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
  cancelling,
  onCancel,
}: {
  booking: BookingListItem;
  cancelling: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
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
        {[
          ['Check-in', formatDate(booking.checkin)],
          ['Check-out', formatDate(booking.checkout)],
          ['Confirmation #', booking.confirmationNumber],
          ['PIN', booking.pin],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-gray-400 text-xs">{label}</dt>
            <dd className="font-medium text-gray-900 font-mono tracking-wide">{value}</dd>
          </div>
        ))}
      </dl>

      {booking.status === 'CONFIRMED' && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={onCancel}
          >
            Cancel booking
          </Button>
        </div>
      )}
    </div>
  );
}
