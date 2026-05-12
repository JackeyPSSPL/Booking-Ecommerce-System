import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import PartnerLayout from '../partner-layout';

type StatusTab = 'ALL' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

const TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'NO_SHOW',   label: 'No-show' },
];

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-gray-800 text-right ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function PartnerBookingsPage() {
  const [tab, setTab]           = useState<StatusTab>('ALL');
  const [selected, setSelected] = useState<any>(null);
  const qc                      = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['partner-bookings', tab],
    queryFn: () => partnerApi.getBookings({ status: tab }),
    staleTime: 30_000,
  });

  const noShowMutation = useMutation({
    mutationFn: (id: string) => partnerApi.markNoShow(id),
    onSuccess: () => {
      toast.success('Booking marked as no-show');
      qc.invalidateQueries({ queryKey: ['partner-bookings'] });
      setSelected(null);
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const bookings: any[] = data?.data?.data ?? [];
  const total: number   = data?.data?.total ?? 0;

  const isFutureConfirmed = (b: any) =>
    b.status === 'CONFIRMED' && new Date(b.checkin) > new Date();

  return (
    <PartnerLayout title="Bookings">
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#003580] text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isError && <ErrorBanner message={getApiError(error)} />}

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No bookings found</p>
          {tab !== 'ALL' && (
            <button onClick={() => setTab('ALL')} className="mt-3 text-sm text-[#003580] hover:underline">
              View all bookings
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">{total} booking{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  {['Booking Ref', 'Guest', 'Property', 'Room', 'Check-in', 'Check-out', 'Total', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr
                    key={b.id}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(b)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.confirmationNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{b.guestName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{b.property?.name}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{b.roomType?.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(b.checkin)}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(b.checkout)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatPrice(Number(b.totalPrice))}</td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {isFutureConfirmed(b) && (
                        <button
                          onClick={() => { if (confirm('Mark this booking as no-show?')) noShowMutation.mutate(b.id); }}
                          disabled={noShowMutation.isPending}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          No-show
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Booking Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-3 text-sm">
              <Row label="Ref"       value={selected.confirmationNumber} mono />
              <Row label="Guest"     value={selected.guestName} />
              <Row label="Email"     value={selected.guestEmail} />
              <Row label="Phone"     value={selected.guestPhone} />
              <Row label="Country"   value={selected.guestCountry} />
              <Row label="Property"  value={selected.property?.name} />
              <Row label="Room"      value={selected.roomType?.name} />
              <Row label="Check-in"  value={formatDate(selected.checkin)} />
              <Row label="Check-out" value={formatDate(selected.checkout)} />
              <Row label="Adults"    value={String(selected.adults)} />
              <Row label="Total"     value={formatPrice(Number(selected.totalPrice))} />
              {selected.arrivalTime && <Row label="Arrival" value={selected.arrivalTime} />}
              {selected.specialRequests && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Special requests</p>
                  <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-xs">{selected.specialRequests}</p>
                </div>
              )}
              {selected.cancellationReason && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Cancellation reason</p>
                  <p className="text-gray-700 text-xs">{selected.cancellationReason}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <p className="text-gray-500">Status</p>
                <Badge status={selected.status} />
              </div>
            </div>
            {isFutureConfirmed(selected) && (
              <button
                onClick={() => { if (confirm('Mark as no-show?')) noShowMutation.mutate(selected.id); }}
                disabled={noShowMutation.isPending}
                className="mt-5 w-full bg-red-50 text-red-600 border border-red-200 font-medium py-2 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-60"
              >
                Mark as No-show
              </button>
            )}
          </div>
        </div>
      )}
    </PartnerLayout>
  );
}
