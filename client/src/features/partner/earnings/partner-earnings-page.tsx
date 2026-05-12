import { useQuery } from '@tanstack/react-query';
import { partnerApi } from '../../../api/partner.api';
import { getApiError } from '../../../utils/error';
import { formatPrice, formatDate } from '../../../utils/format';
import Spinner from '../../../components/ui/Spinner';
import ErrorBanner from '../../../components/ui/ErrorBanner';
import Badge from '../../../components/ui/Badge';
import PartnerLayout from '../partner-layout';

function EarningCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function PartnerEarningsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['partner-earnings'],
    queryFn: partnerApi.getEarnings,
    staleTime: 60_000,
  });

  const summary         = data?.data?.summary;
  const bookings: any[] = data?.data?.bookings ?? [];

  return (
    <PartnerLayout title="Earnings">
      {isError && <ErrorBanner message={getApiError(error)} />}

      {isLoading ? (
        <div className="py-16 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <EarningCard label="This Month"    value={formatPrice(summary?.thisMonth ?? 0)} sub="Revenue" />
            <EarningCard label="Last Month"    value={formatPrice(summary?.lastMonth ?? 0)} sub="Revenue" />
            <EarningCard label="Lifetime Total" value={formatPrice(summary?.lifetime ?? 0)} sub="All time" />
            <EarningCard label="Commission Rate" value={`${((summary?.commissionRate ?? 0.12) * 100).toFixed(0)}%`} sub="Platform fee" />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-700 mb-6">
            💳 Payout disbursement is processed monthly. Bank transfer integration coming in Phase 2.
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Booking Payouts</h2>
            </div>

            {bookings.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="text-3xl mb-2">💰</p>
                <p>No earnings yet — confirmed bookings will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {['Booking Ref', 'Property', 'Room', 'Check-out', 'Total', 'Commission (12%)', 'Your Payout', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.confirmationNumber}</td>
                        <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{b.property}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{b.roomType}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(b.checkoutDate)}</td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{formatPrice(b.total)}</td>
                        <td className="px-4 py-3 text-red-500">- {formatPrice(b.commission)}</td>
                        <td className="px-4 py-3 font-bold text-green-600">{formatPrice(b.payout)}</td>
                        <td className="px-4 py-3"><Badge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={6} className="px-4 py-3 font-bold text-gray-700">Total Payout</td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        {formatPrice(bookings.reduce((s, b) => s + b.payout, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PartnerLayout>
  );
}
