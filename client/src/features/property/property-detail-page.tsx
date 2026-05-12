import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { propertiesApi } from '../../api/properties.api';
import { bookingsApi } from '../../api/bookings.api';
import { useCheckoutStore } from '../../store/checkout.store';
import { useAuthStore } from '../../store/auth.store';
import { Property, RoomType } from '../../types';
import { formatPrice, formatNights } from '../../utils/format';
import { getApiError } from '../../utils/error';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { accessToken } = useAuthStore();
  const { setRoomSelection, setHoldId } = useCheckoutStore();

  const checkin = searchParams.get('checkin') ?? '';
  const checkout = searchParams.get('checkout') ?? '';
  const adults = Number(searchParams.get('adults') ?? 1);
  const nights = checkin && checkout ? formatNights(checkin, checkout) : 1;

  const { data: property, isLoading, isError, error } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const holdMutation = useMutation({
    mutationFn: (roomTypeId: string) =>
      bookingsApi.createHold({ roomTypeId, propertyId: id!, checkin, checkout, adults, children: 0 }),
    onSuccess: (res, roomTypeId) => {
      const room = property!.roomTypes.find((rt) => rt.id === roomTypeId)!;
      const ratePlan =
        room.ratePlans.find((rp) => rp.planType === 'STANDARD') ?? room.ratePlans[0];
      setRoomSelection({
        propertyId: id!,
        roomTypeId,
        ratePlanId: ratePlan?.id ?? '',
        checkin,
        checkout,
        adults,
        children: 0,
        priceBreakdown: {
          basePrice: Number(room.basePrice),
          nights,
          taxes: 0,
          total: Number(room.basePrice) * nights,
        },
        holdId: res.data.id,
      });
      setHoldId(res.data.id);
      navigate('/checkout/details');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleReserve = (roomTypeId: string) => {
    if (!accessToken) {
      toast.error('Please sign in to make a reservation');
      navigate('/login');
      return;
    }
    if (!checkin || !checkout) {
      toast.error('No dates selected — go back to search and pick your dates');
      return;
    }
    holdMutation.mutate(roomTypeId);
  };

  if (isLoading)
    return (
      <>
        <Header />
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </>
    );

  if (isError || !property)
    return (
      <>
        <Header />
        <PageWrapper>
          <ErrorBanner message={getApiError(error)} />
        </PageWrapper>
      </>
    );

  const amenities = property.amenities as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <PageWrapper>
        {/* Cover */}
        <div className="h-64 sm:h-80 bg-gray-200 rounded-xl overflow-hidden mb-6">
          {property.images[0] ? (
            <img
              src={property.images[0].url}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              No image available
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                  <p className="text-gray-500 mt-1">
                    {property.address}, {property.city}
                  </p>
                  <p className="text-sm text-gray-400 capitalize mt-0.5">
                    {property.category.toLowerCase()}
                  </p>
                </div>
                {property.starRating && (
                  <span className="flex items-center gap-1 text-yellow-500 font-bold shrink-0">
                    ★ {property.starRating}
                  </span>
                )}
              </div>
              {property.description && (
                <p className="mt-4 text-gray-600 text-sm leading-relaxed">
                  {property.description}
                </p>
              )}
              {amenities.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a) => (
                      <span
                        key={a}
                        className="bg-gray-100 text-gray-700 text-xs rounded-full px-3 py-1"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900">Available Rooms</h2>
            {property.roomTypes.length === 0 ? (
              <p className="text-gray-400 text-sm">No rooms available for this property yet.</p>
            ) : (
              <div className="space-y-3">
                {property.roomTypes.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    nights={nights}
                    loading={holdMutation.isPending && holdMutation.variables === room.id}
                    onReserve={() => handleReserve(room.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: stay summary */}
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-3">Your stay</h3>
              {checkin && checkout ? (
                <dl className="space-y-2 text-sm">
                  {[
                    ['Check-in', checkin],
                    ['Check-out', checkout],
                    ['Nights', nights],
                    ['Guests', `${adults} adult${adults !== 1 ? 's' : ''}`],
                  ].map(([label, value]) => (
                    <div key={label as string} className="flex justify-between">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="font-medium text-gray-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-400">
                  No dates selected. Go back to search and pick check-in / check-out dates.
                </p>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
      <Footer />
    </div>
  );
}

function RoomCard({
  room,
  nights,
  loading,
  onReserve,
}: {
  room: RoomType;
  nights: number;
  loading: boolean;
  onReserve: () => void;
}) {
  const pricePerNight = Number(room.basePrice);
  const total = pricePerNight * nights;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900">{room.name}</h3>
        {room.description && (
          <p className="text-sm text-gray-500 mt-1">{room.description}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span>👤 Up to {room.maxOccupancy} guests</span>
          <span>
            🍽 {room.mealPlan === 'BREAKFAST' ? 'Breakfast included' : 'Room only'}
          </span>
          <span>
            {room.cancellationPolicy === 'FLEXIBLE'
              ? '✅ Free cancellation'
              : '❌ Non-refundable'}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-gray-900">
          {formatPrice(pricePerNight)}
          <span className="text-xs text-gray-400 font-normal"> /night</span>
        </p>
        {nights > 1 && (
          <p className="text-sm text-gray-500">{formatPrice(total)} total</p>
        )}
        <Button size="sm" className="mt-3" onClick={onReserve} loading={loading}>
          Reserve
        </Button>
      </div>
    </div>
  );
}
