import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { propertiesApi } from '../../../api/properties.api';
import { getApiError } from '../../../utils/error';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import PartnerLayout from '../partner-layout';

const AMENITY_LIST = [
  'WiFi', 'Parking', 'AC', 'Pool', 'Kitchen', 'Gym', 'Elevator', 'Breakfast',
  'TV', 'Washer', 'Dryer', 'Safe', 'Balcony', 'Garden',
];

const CATEGORIES = ['HOTEL', 'APARTMENT', 'VILLA', 'HOSTEL', 'OTHER'];

const ROOM_TYPE_OPTIONS = [
  'Standard Room', 'Deluxe Room', 'Suite', 'Single Room', 'Double Room',
  'Twin Room', 'Family Room', 'Studio', 'Executive Room', 'Penthouse',
];

interface EditState {
  name: string;
  address: string;
  city: string;
  postcode: string;
  category: string;
  starRating: number;
  description: string;
  amenities: string[];
  bookingMode: 'INSTANT' | 'REQUEST';
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003580] transition-colors';

export default function PartnerPropertyEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.getById(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const property = data?.data;

  const [form, setForm] = useState<EditState>({
    name: '', address: '', city: '', postcode: '', category: 'HOTEL',
    starRating: 3, description: '', amenities: [], bookingMode: 'INSTANT',
  });

  useEffect(() => {
    if (!property) return;
    setForm({
      name:        property.name        ?? '',
      address:     property.address     ?? '',
      city:        property.city        ?? '',
      postcode:    property.postcode    ?? '',
      category:    property.category    ?? 'HOTEL',
      starRating:  property.starRating  ?? 3,
      description: property.description ?? '',
      amenities:   Array.isArray(property.amenities) ? property.amenities as string[] : [],
      bookingMode: (property.bookingMode ?? 'INSTANT') as 'INSTANT' | 'REQUEST',
    });
  }, [property]);

  const patch = (p: Partial<EditState>) => setForm(s => ({ ...s, ...p }));

  const toggleAmenity = (a: string) => {
    patch({ amenities: form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      propertiesApi.update(id!, {
        name:        form.name,
        address:     form.address,
        city:        form.city,
        postcode:    form.postcode,
        category:    form.category,
        starRating:  form.starRating,
        description: form.description,
        amenities:   form.amenities,
        bookingMode: form.bookingMode,
      }),
    onSuccess: () => {
      toast.success('Property updated!');
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      navigate('/partner/dashboard');
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const [showRtForm, setShowRtForm] = useState(false);
  const [rtForm, setRtForm] = useState({ name: '', maxOccupancy: 2, basePrice: '' });

  const addRtMutation = useMutation({
    mutationFn: () => propertiesApi.addRoomType(id!, {
      name:               rtForm.name,
      maxOccupancy:       rtForm.maxOccupancy,
      basePrice:          Number(rtForm.basePrice),
      mealPlan:           'NONE',
      cancellationPolicy: 'FLEXIBLE',
      bedConfig:          {},
    }),
    onSuccess: () => {
      toast.success('Room type added!');
      setShowRtForm(false);
      setRtForm({ name: '', maxOccupancy: 2, basePrice: '' });
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['partner-properties'] });
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())    { toast.error('Name is required'); return; }
    if (!form.address.trim()) { toast.error('Address is required'); return; }
    if (!form.city.trim())    { toast.error('City is required'); return; }
    saveMutation.mutate();
  };

  if (isLoading) return (
    <PartnerLayout title="Edit Property" backTo="/partner/dashboard">
      <div className="flex justify-center py-16"><Spinner size="lg" /></div>
    </PartnerLayout>
  );

  if (isError || !property) return (
    <PartnerLayout title="Edit Property" backTo="/partner/dashboard">
      <ErrorBanner message={getApiError(error)} />
    </PartnerLayout>
  );

  return (
    <PartnerLayout title={`Edit: ${property.name}`} backTo="/partner/dashboard">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Basic Info</h2>

          <FieldRow label="Property name *">
            <input
              className={INPUT_CLS}
              value={form.name}
              onChange={e => patch({ name: e.target.value })}
              placeholder="e.g. The Grand Manali Retreat"
            />
          </FieldRow>

          <FieldRow label="Street address *">
            <input
              className={INPUT_CLS}
              value={form.address}
              onChange={e => patch({ address: e.target.value })}
              placeholder="Full street address"
            />
          </FieldRow>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="City *">
              <input className={INPUT_CLS} value={form.city} onChange={e => patch({ city: e.target.value })} placeholder="City" />
            </FieldRow>
            <FieldRow label="Postcode">
              <input className={INPUT_CLS} value={form.postcode} onChange={e => patch({ postcode: e.target.value })} placeholder="6-digit" maxLength={6} />
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Category">
              <select
                value={form.category}
                onChange={e => patch({ category: e.target.value })}
                className={INPUT_CLS}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Star rating">
              <select
                value={form.starRating}
                onChange={e => patch({ starRating: Number(e.target.value) })}
                className={INPUT_CLS}
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
              </select>
            </FieldRow>
          </div>
        </div>

        {/* Description + booking mode */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Property Details</h2>

          <FieldRow label="Description">
            <textarea
              value={form.description}
              onChange={e => patch({ description: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Describe your property…"
              className={`${INPUT_CLS} resize-none`}
            />
          </FieldRow>

          <FieldRow label="Booking mode">
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'INSTANT', label: 'Instant booking', desc: 'Guests book without waiting', recommended: true },
                { val: 'REQUEST', label: 'Request to book', desc: 'You approve each booking' },
              ].map(opt => (
                <label
                  key={opt.val}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.bookingMode === opt.val ? 'border-[#003580] bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio" name="bookingMode" value={opt.val}
                    checked={form.bookingMode === opt.val}
                    onChange={() => patch({ bookingMode: opt.val as 'INSTANT' | 'REQUEST' })}
                    className="sr-only"
                  />
                  {opt.recommended && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-[#FFCC00] text-gray-900 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </label>
              ))}
            </div>
          </FieldRow>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_LIST.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  form.amenities.includes(a)
                    ? 'bg-[#003580] text-white border-[#003580]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#003580]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Room Types */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Room Types</h2>
            <button
              type="button"
              onClick={() => setShowRtForm(v => !v)}
              className="text-xs text-[#003580] font-semibold hover:underline"
            >
              {showRtForm ? 'Cancel' : '+ Add room type'}
            </button>
          </div>

          {(property.roomTypes?.length ?? 0) === 0 && !showRtForm && (
            <p className="text-sm text-gray-400">No room types yet — add at least one so customers can book.</p>
          )}

          <div className="space-y-2">
            {property.roomTypes?.map((rt: any) => (
              <div key={rt.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{rt.name}</p>
                  <p className="text-xs text-gray-400">Max {rt.maxOccupancy} guests · ₹{Number(rt.basePrice).toLocaleString('en-IN')}/night</p>
                </div>
              </div>
            ))}
          </div>

          {showRtForm && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              <FieldRow label="Room type *">
                <select
                  className={INPUT_CLS}
                  value={rtForm.name}
                  onChange={e => setRtForm(f => ({ ...f, name: e.target.value }))}
                >
                  <option value="">— Select room type —</option>
                  {ROOM_TYPE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </FieldRow>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Max occupancy">
                  <input
                    type="number" min={1} max={30}
                    className={INPUT_CLS}
                    value={rtForm.maxOccupancy}
                    onChange={e => setRtForm(f => ({ ...f, maxOccupancy: Number(e.target.value) }))}
                  />
                </FieldRow>
                <FieldRow label="Base price (₹/night) *">
                  <input
                    type="number" min={1}
                    className={INPUT_CLS}
                    placeholder="e.g. 2500"
                    value={rtForm.basePrice}
                    onChange={e => setRtForm(f => ({ ...f, basePrice: e.target.value }))}
                  />
                </FieldRow>
              </div>
              <button
                type="button"
                disabled={addRtMutation.isPending}
                onClick={() => {
                  if (!rtForm.name.trim()) { toast.error('Room name is required'); return; }
                  if (!rtForm.basePrice || Number(rtForm.basePrice) <= 0) { toast.error('Enter a valid price'); return; }
                  addRtMutation.mutate();
                }}
                className="px-5 py-2 bg-[#003580] text-white text-sm font-bold rounded-xl hover:bg-[#00224F] transition-colors disabled:opacity-60"
              >
                {addRtMutation.isPending ? 'Adding…' : 'Add room type'}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/partner/dashboard')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-8 py-2.5 bg-[#003580] text-white text-sm font-bold rounded-xl hover:bg-[#00224F] transition-colors disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </PartnerLayout>
  );
}
