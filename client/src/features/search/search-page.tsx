import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { propertiesApi } from '../../api/properties.api';
import { SearchResult } from '../../types';
import { getApiError } from '../../utils/error';
import { todayStr, tomorrowStr } from '../../utils/format';
import Header from '../../components/layout/Header';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PropertyCard from './property-card';

// ── Popular destinations ──────────────────────────────────────────────────────

const DESTINATIONS = [
  {
    city:       'Ahmedabad',
    subtitle:   'Gujarat, India',
    properties: 4,
    image:      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80&auto=format&fit=crop',
  },
  {
    city:       'Manali',
    subtitle:   'Himachal Pradesh, India',
    properties: 4,
    image:      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80&auto=format&fit=crop',
  },
  {
    city:       'Goa',
    subtitle:   'Goa, India',
    properties: 4,
    image:      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80&auto=format&fit=crop',
  },
];

// ── Property types ────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { label: 'Hotels',   icon: '🏨' },
  { label: 'Resorts',  icon: '🌴' },
  { label: 'Villas',   icon: '🏡' },
  { label: 'Hostels',  icon: '🛏' },
  { label: 'Heritage', icon: '🏰' },
];

// ── Search Page ───────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [checkin, setCheckin]   = useState(searchParams.get('checkin')  ?? todayStr());
  const [checkout, setCheckout] = useState(searchParams.get('checkout') ?? tomorrowStr());
  const [adults, setAdults]     = useState(Number(searchParams.get('adults') ?? 1));

  const activeDestination = searchParams.get('destination');
  const activeCheckin     = searchParams.get('checkin')  ?? checkin;
  const activeCheckout    = searchParams.get('checkout') ?? checkout;
  const activeAdults      = Number(searchParams.get('adults') ?? adults);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn:  () => propertiesApi.search({
      destination: activeDestination!,
      checkin:     activeCheckin,
      checkout:    activeCheckout,
      adults:      activeAdults,
    }),
    enabled: !!activeDestination,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setSearchParams({ destination, checkin, checkout, adults: String(adults) });
  };

  const triggerSearch = (dest: string) => {
    setDestination(dest);
    setSearchParams({ destination: dest, checkin, checkout, adults: String(adults) });
  };

  const results: SearchResult[] = data?.data ?? [];
  const total                   = data?.meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-[#f2f6fa]">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center px-4 py-16"
        style={{ background: 'linear-gradient(135deg, #003580 0%, #0057b8 60%, #1a73e8 100%)' }}
      >
        {/* Dot-pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        <div className="relative z-10 text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Find your perfect stay
          </h1>
          <p className="text-blue-200 text-base md:text-lg">
            Hotels, villas, resorts and more across India
          </p>
        </div>

        {/* Search card */}
        <form
          onSubmit={handleSearch}
          className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-4"
        >
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                📍 Destination
              </label>
              <input
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="Where are you going?"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003580] transition-colors"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                📅 Check-in
              </label>
              <input
                type="date"
                value={checkin}
                min={todayStr()}
                onChange={e => { setCheckin(e.target.value); if (checkout <= e.target.value) setCheckout(e.target.value); }}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                📅 Check-out
              </label>
              <input
                type="date"
                value={checkout}
                min={checkin}
                onChange={e => setCheckout(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors"
              />
            </div>

            <div className="min-w-[120px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                👤 Adults
              </label>
              <select
                value={adults}
                onChange={e => setAdults(Number(e.target.value))}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} adult{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="h-[44px] px-8 rounded-xl font-bold text-sm text-gray-900 transition-colors"
              style={{ background: '#FFCC00' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#E6B800')}
              onMouseLeave={e => (e.currentTarget.style.background = '#FFCC00')}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ── Landing dashboard (no search active) ─────────────────────────── */}
      {!activeDestination && (
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">

          {/* Popular destinations */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Popular destinations</h2>
            <p className="text-sm text-gray-500 mb-5">Travellers searching for a place to stay in India</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DESTINATIONS.map(dest => (
                <button
                  key={dest.city}
                  onClick={() => triggerSearch(dest.city)}
                  className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow text-left h-52"
                >
                  <img
                    src={dest.image}
                    alt={dest.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <p className="text-white font-bold text-lg leading-none">{dest.city}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{dest.subtitle}</p>
                    <span className="mt-2 inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {dest.properties} properties
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Browse by property type */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Browse by property type</h2>
            <p className="text-sm text-gray-500 mb-5">Choose the type of stay that suits you</p>
            <div className="flex flex-wrap gap-3">
              {PROPERTY_TYPES.map(type => (
                <button
                  key={type.label}
                  onClick={() => triggerSearch(DESTINATIONS[0].city)}
                  className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:border-[#003580] hover:text-[#003580] hover:shadow-md transition-all"
                >
                  <span className="text-lg">{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </section>

          {/* Deals */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-5">Offers — Deals, promotions and more</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #003580 0%, #0057b8 100%)' }}
              >
                <div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Limited time</span>
                  <h3 className="text-white text-xl font-bold mt-1">Save 20% on Manali stays</h3>
                  <p className="text-blue-200 text-sm mt-1">Book before 31st May 2026</p>
                </div>
                <button
                  onClick={() => triggerSearch('Manali')}
                  className="mt-4 self-start bg-[#FFCC00] text-gray-900 text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#E6B800] transition-colors"
                >
                  Explore deals →
                </button>
                <div className="absolute right-4 top-4 text-5xl opacity-20 select-none">⛰</div>
              </div>

              <div
                className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #00875A 0%, #00b87c 100%)' }}
              >
                <div>
                  <span className="text-[10px] font-bold text-green-200 uppercase tracking-widest">Free cancellation</span>
                  <h3 className="text-white text-xl font-bold mt-1">Flexible Goa beach getaway</h3>
                  <p className="text-green-200 text-sm mt-1">Cancel anytime, no fees</p>
                </div>
                <button
                  onClick={() => triggerSearch('Goa')}
                  className="mt-4 self-start bg-white text-green-800 text-sm font-bold px-5 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  Explore Goa →
                </button>
                <div className="absolute right-4 top-4 text-5xl opacity-20 select-none">🏖</div>
              </div>
            </div>
          </section>

          {/* Why StayBook */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Why choose StayBook?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: '💰', title: 'Best price guarantee', desc: "Find a lower price? We'll match it and give you a discount." },
                { icon: '✅', title: 'Free cancellation',    desc: 'Flexible plans available on most rooms — cancel with no fee.' },
                { icon: '🛡', title: 'Secure booking',       desc: 'Your payment and personal data are always protected.' },
              ].map(perk => (
                <div key={perk.title} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-3">
                    {perk.icon}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="text-center text-xs text-gray-400 pb-4">
            © 2026 StayBook · All rights reserved · India's favourite hotel booking platform
          </p>
        </div>
      )}

      {/* ── Search results ────────────────────────────────────────────────── */}
      {activeDestination && (
        <PageWrapper>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Properties in <strong>{activeDestination}</strong>
            </h2>
            {!isLoading && (
              <span className="text-xs bg-[#003580] text-white px-2 py-0.5 rounded-full">
                {total} propert{total !== 1 ? 'ies' : 'y'}
              </span>
            )}
          </div>

          {isLoading && <div className="py-16"><Spinner size="lg" /></div>}
          {isError   && <ErrorBanner message={getApiError(error)} />}

          {!isLoading && !isError && results.length === 0 && (
            <p className="text-center text-gray-400 py-16">
              No properties found in <strong>{activeDestination}</strong>. Try a different destination.
            </p>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map(p => (
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
        </PageWrapper>
      )}
    </div>
  );
}
