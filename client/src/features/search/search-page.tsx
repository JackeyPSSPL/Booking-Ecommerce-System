import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../../api/properties.api';
import { SearchResult } from '../../types';
import { getApiError } from '../../utils/error';
import { todayStr, tomorrowStr } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PropertyCard from './property-card';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [checkin, setCheckin] = useState(searchParams.get('checkin') ?? todayStr());
  const [checkout, setCheckout] = useState(searchParams.get('checkout') ?? tomorrowStr());
  const [adults, setAdults] = useState(Number(searchParams.get('adults') ?? 1));

  const activeDestination = searchParams.get('destination');
  const activeCheckin = searchParams.get('checkin') ?? checkin;
  const activeCheckout = searchParams.get('checkout') ?? checkout;
  const activeAdults = Number(searchParams.get('adults') ?? adults);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn: () =>
      propertiesApi.search({
        destination: activeDestination!,
        checkin: activeCheckin,
        checkout: activeCheckout,
        adults: activeAdults,
      }),
    enabled: !!activeDestination,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setSearchParams({ destination, checkin, checkout, adults: String(adults) });
  };

  const results: SearchResult[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-primary-500 py-12 px-4">
        <div className="mx-auto max-w-4xl text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Find your next stay</h1>
          <p className="text-blue-100 text-sm">Hotels, apartments, villas and more</p>
        </div>
        <form
          onSubmit={handleSearch}
          className="mx-auto max-w-4xl bg-white rounded-xl p-3 flex flex-wrap gap-2 items-center"
        >
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="date"
            value={checkin}
            min={todayStr()}
            onChange={(e) => {
              setCheckin(e.target.value);
              if (checkout <= e.target.value) setCheckout(e.target.value);
            }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <input
            type="date"
            value={checkout}
            min={checkin}
            onChange={(e) => setCheckout(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} adult{n !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <PageWrapper>
        {!activeDestination && (
          <p className="text-center text-gray-400 py-16">Enter a destination to start searching.</p>
        )}
        {isLoading && (
          <div className="py-16">
            <Spinner size="lg" />
          </div>
        )}
        {isError && <ErrorBanner message={getApiError(error)} />}
        {activeDestination && !isLoading && !isError && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              <strong>{total}</strong> propert{total !== 1 ? 'ies' : 'y'} in{' '}
              <strong>{activeDestination}</strong>
            </p>
            {results.length === 0 ? (
              <p className="text-center text-gray-400 py-16">
                No properties found. Try a different destination or dates.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {results.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    checkin={activeCheckin}
                    checkout={activeCheckout}
                    adults={activeAdults}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </div>
  );
}
