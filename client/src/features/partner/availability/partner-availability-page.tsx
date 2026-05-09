import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import PartnerLayout from '../partner-layout';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDatesInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export default function PartnerAvailabilityPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const { data: propData } = useQuery({
    queryKey: ['partner-properties'],
    queryFn: partnerApi.getProperties,
    staleTime: 60_000,
  });

  const properties: any[] = propData?.data ?? [];
  const property = properties.find((p: any) => p.id === propertyId);
  const roomTypes: any[] = property?.roomTypes ?? [];

  const activeRoom = selectedRoom || roomTypes[0]?.id || '';

  const { data: avData, isLoading, isError, error } = useQuery({
    queryKey: ['partner-availability', propertyId, year, month],
    queryFn: () => partnerApi.getAvailability(propertyId!, year, month),
    enabled: !!propertyId,
    staleTime: 30_000,
  });

  const avRows: any[] = avData?.data ?? [];

  const avMap = avRows.reduce<Record<string, { isBlocked: boolean; bookingId: string | null }>>((acc, row) => {
    if (row.roomType?.id === activeRoom) {
      acc[toDateStr(new Date(row.date))] = { isBlocked: row.isBlocked, bookingId: row.bookingId };
    }
    return acc;
  }, {});

  const saveMutation = useMutation({
    mutationFn: (dates: { date: string; roomTypeId: string; isBlocked: boolean }[]) =>
      partnerApi.updateAvailability(propertyId!, dates),
    onSuccess: () => {
      toast.success('Availability saved');
      setPending({});
      qc.invalidateQueries({ queryKey: ['partner-availability', propertyId] });
    },
    onError: (e) => toast.error(getApiError(e)),
  });

  const toggleDate = (dateStr: string) => {
    const today = toDateStr(now);
    if (dateStr < today) return;
    const booked = avMap[dateStr]?.bookingId;
    if (booked) { toast.error('Date has an active booking and cannot be modified'); return; }

    const current = pending[dateStr] ?? avMap[dateStr]?.isBlocked ?? false;
    setPending(p => ({ ...p, [dateStr]: !current }));
  };

  const handleSave = () => {
    if (!activeRoom) { toast.error('Select a room type first'); return; }
    const dates = Object.entries(pending).map(([date, isBlocked]) => ({ date, roomTypeId: activeRoom, isBlocked }));
    if (!dates.length) { toast('No changes to save'); return; }
    saveMutation.mutate(dates);
  };

  const dates = getDatesInMonth(year, month);
  const firstDow = dates[0].getDay();

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const getCellState = (dateStr: string) => {
    if (pending[dateStr] !== undefined) return pending[dateStr] ? 'pending-block' : 'pending-unblock';
    const av = avMap[dateStr];
    if (!av) return 'available';
    if (av.bookingId) return 'booked';
    if (av.isBlocked) return 'blocked';
    return 'available';
  };

  const cellStyles: Record<string, string> = {
    'available':       'bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-400 cursor-pointer',
    'blocked':         'bg-gray-100 border-gray-300 text-gray-400 hover:bg-white hover:border-gray-400 cursor-pointer',
    'booked':          'bg-blue-50 border-blue-200 text-blue-700 cursor-not-allowed',
    'pending-block':   'bg-red-50 border-red-300 text-red-600 cursor-pointer ring-2 ring-red-200',
    'pending-unblock': 'bg-green-50 border-green-300 text-green-700 cursor-pointer ring-2 ring-green-200',
  };

  return (
    <PartnerLayout title="Availability Calendar">
      {isError && <ErrorBanner message={getApiError(error)} />}

      <div className="flex flex-wrap gap-4 mb-6 items-start">
        {/* Room selector */}
        {roomTypes.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Room Type</label>
            <select
              value={activeRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#003580]"
            >
              {roomTypes.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs mt-auto">
          {[
            { color: 'bg-white border border-gray-300', label: 'Available' },
            { color: 'bg-gray-100 border border-gray-300', label: 'Blocked' },
            { color: 'bg-blue-50 border border-blue-200', label: 'Booked' },
            { color: 'bg-red-50 border border-red-300', label: 'Pending block' },
            { color: 'bg-green-50 border border-green-300', label: 'Pending unblock' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${l.color}`} />
              <span className="text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">←</button>
          <h2 className="text-base font-bold text-gray-800">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">→</button>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Spinner /></div>
        ) : (
          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
              ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
              {dates.map(date => {
                const dateStr = toDateStr(date);
                const isPast  = dateStr < toDateStr(now);
                const state   = getCellState(dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => !isPast && toggleDate(dateStr)}
                    disabled={isPast || state === 'booked'}
                    className={`
                      rounded-lg border text-sm p-2 text-center transition-all select-none
                      ${isPast ? 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed' : cellStyles[state]}
                    `}
                    title={state === 'booked' ? 'Has active booking' : ''}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    {state === 'booked' && <span className="block text-[9px] mt-0.5">booked</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Save bar */}
        {Object.keys(pending).length > 0 && (
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-amber-50">
            <p className="text-sm text-amber-700 font-medium">
              {Object.keys(pending).length} date{Object.keys(pending).length !== 1 ? 's' : ''} changed — unsaved
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPending({})}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-[#003580] text-white text-sm font-bold rounded-lg hover:bg-[#00224F] transition-colors disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
