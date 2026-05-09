import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import PartnerLayout from '../partner-layout';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function PartnerDashboardPage() {
  const summaryQ   = useQuery({ queryKey: ['partner-summary'],    queryFn: partnerApi.getSummary,          staleTime: 60_000 });
  const propertiesQ = useQuery({ queryKey: ['partner-properties'], queryFn: partnerApi.getProperties,        staleTime: 60_000 });
  const arrivalsQ  = useQuery({ queryKey: ['partner-arrivals'],   queryFn: partnerApi.getUpcomingArrivals,  staleTime: 60_000 });

  const summary    = summaryQ.data?.data;
  const properties = propertiesQ.data?.data ?? [];
  const arrivals   = arrivalsQ.data?.data ?? [];

  const statusColor: Record<string, string> = {
    ACTIVE: 'text-green-700 bg-green-50 border-green-200',
    DRAFT:  'text-yellow-700 bg-yellow-50 border-yellow-200',
    PAUSED: 'text-gray-600 bg-gray-100 border-gray-200',
  };

  return (
    <PartnerLayout title="Dashboard">
      {summaryQ.isError && <ErrorBanner message={getApiError(summaryQ.error)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryQ.isLoading ? (
          <div className="col-span-4 py-6 flex justify-center"><Spinner /></div>
        ) : (
          <>
            <StatCard label="Total Properties"   value={summary?.totalProperties   ?? 0} color="text-[#003580]" />
            <StatCard label="Active Bookings"    value={summary?.activeBookings    ?? 0} color="text-green-600" sub="with future checkout" />
            <StatCard label="Revenue This Month" value={formatPrice(summary?.monthlyRevenue ?? 0)} color="text-emerald-600" />
            <StatCard label="Upcoming Arrivals"  value={summary?.upcomingArrivals  ?? 0} color="text-orange-500" sub="next 7 days" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Properties list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Your Properties</h2>
            <Link
              to="/partner/onboarding"
              className="text-sm font-medium text-white bg-[#003580] hover:bg-[#00224F] px-4 py-1.5 rounded-lg transition-colors"
            >
              + Add Property
            </Link>
          </div>

          {propertiesQ.isLoading && <div className="py-8 flex justify-center"><Spinner /></div>}
          {propertiesQ.isError && <ErrorBanner message={getApiError(propertiesQ.error)} />}

          {!propertiesQ.isLoading && properties.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <p className="text-4xl mb-3">🏨</p>
              <p className="text-gray-600 font-medium">No properties yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">List your first property to start receiving bookings</p>
              <Link
                to="/partner/onboarding"
                className="inline-block bg-[#FFCC00] text-gray-900 font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#E6B800] transition-colors"
              >
                Add your first property →
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {properties.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center">
                {p.images?.[0] ? (
                  <img src={p.images[0].url} alt={p.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl shrink-0">🏨</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.city} · {p.category}</p>
                  <p className="text-xs text-gray-400">{p.roomTypes?.length ?? 0} room types · {p._count?.bookings ?? 0} bookings</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-full ${statusColor[p.status] ?? ''}`}>
                    {p.status}
                  </span>
                  <Link
                    to={`/partner/properties/${p.id}/availability`}
                    className="text-xs text-[#003580] hover:underline font-medium"
                  >
                    Availability →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming arrivals */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-4">Upcoming Arrivals</h2>
          {arrivalsQ.isLoading && <div className="py-6 flex justify-center"><Spinner size="sm" /></div>}
          {arrivals.length === 0 && !arrivalsQ.isLoading && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">
              No arrivals in the next 7 days
            </div>
          )}
          <div className="space-y-3">
            {arrivals.map((a: any) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="font-semibold text-gray-800 text-sm">{a.guestName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.property.name} · {a.roomType.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#003580] font-medium">
                    Check-in: {formatDate(a.checkin)}
                  </span>
                  <Badge status="CONFIRMED" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PartnerLayout>
  );
}
