import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { propertiesApi } from '../../api/properties.api';
import { SearchResult } from '../../types';
import { getApiError } from '../../utils/error';
import { todayStr, tomorrowStr, formatDate } from '../../utils/format';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import PageWrapper from '../../components/layout/PageWrapper';
import Spinner from '../../components/ui/Spinner';
import ErrorBanner from '../../components/ui/ErrorBanner';
import PropertyCard from './property-card';

// ── Static data ───────────────────────────────────────────────────────────────

const EXPLORE_CITIES = [
  { city: 'New Delhi',  count: 4, image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80&auto=format&fit=crop' },
  { city: 'Mumbai',     count: 4, image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80&auto=format&fit=crop' },
  { city: 'Bengaluru',  count: 4, image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&q=80&auto=format&fit=crop' },
  { city: 'Jaipur',     count: 4, image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&q=80&auto=format&fit=crop' },
  { city: 'Goa',        count: 4, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80&auto=format&fit=crop' },
  { city: 'Ahmedabad',  count: 4, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&q=80&auto=format&fit=crop' },
  { city: 'Manali',     count: 4, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400&q=80&auto=format&fit=crop' },
  { city: 'Rishikesh',  count: 2, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80&auto=format&fit=crop' },
  { city: 'Varanasi',   count: 2, image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=400&q=80&auto=format&fit=crop' },
];

const TRENDING = [
  { city: 'New Delhi',  image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=900&q=80&auto=format&fit=crop', wide: true  },
  { city: 'Bengaluru',  image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Mumbai',     image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Varanasi',   image: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&q=80&auto=format&fit=crop', wide: false },
  { city: 'Rishikesh',  image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80&auto=format&fit=crop', wide: false },
];

const TRENDING_CITIES = ['New Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Bengaluru'];

const CITY_THUMB: Record<string, string> = {
  'New Delhi':  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=120&q=70&auto=format&fit=crop',
  'Mumbai':     'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=120&q=70&auto=format&fit=crop',
  'Bengaluru':  'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=120&q=70&auto=format&fit=crop',
  'Jaipur':     'https://images.unsplash.com/photo-1548013146-72479768bada?w=120&q=70&auto=format&fit=crop',
  'Goa':        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=120&q=70&auto=format&fit=crop',
  'Ahmedabad':  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=120&q=70&auto=format&fit=crop',
  'Manali':     'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=120&q=70&auto=format&fit=crop',
  'Rishikesh':  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&q=70&auto=format&fit=crop',
  'Varanasi':   'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=120&q=70&auto=format&fit=crop',
};

const AMENITY_OPTIONS = ['WiFi', 'Pool', 'Parking', 'Gym', 'Restaurant', 'Spa', 'Breakfast', 'AC'];
const PROPERTY_TYPES  = [
  { label: 'Hotels',   icon: '🏨', value: 'HOTEL'   },
  { label: 'Resorts',  icon: '🌴', value: 'RESORT'  },
  { label: 'Villas',   icon: '🏡', value: 'VILLA'   },
  { label: 'Hostels',  icon: '🛏', value: 'HOSTEL'  },
  { label: 'Heritage', icon: '🏰', value: 'HERITAGE' },
];

type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating_desc';

interface Filters {
  minPrice: number; maxPrice: number; stars: number[]; types: string[]; amenities: string[];
}

const DEFAULT_FILTERS: Filters = { minPrice: 0, maxPrice: 50000, stars: [], types: [], amenities: [] };

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Top picks'          },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Star Rating'         },
];

function getWeekendLabel() {
  const today = new Date();
  const daysUntilFri = ((5 - today.getDay()) + 7) % 7 || 7;
  const fri = new Date(today); fri.setDate(today.getDate() + daysUntilFri);
  const sun = new Date(fri);   sun.setDate(fri.getDate() + 2);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(fri)} – ${fmt(sun)}`;
}

function formatINR(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Filter Sidebar ────────────────────────────────────────────────────────────

function FilterSidebar({ filters, onChange, onReset, resultCount }: {
  filters: Filters; onChange: (f: Filters) => void; onReset: () => void; resultCount: number;
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const hasActive = filters.stars.length > 0 || filters.types.length > 0 ||
    filters.amenities.length > 0 || filters.minPrice > 0 || filters.maxPrice < 50000;

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Filter results</h3>
        {hasActive && <button onClick={onReset} className="text-xs text-[#003580] hover:underline">Reset all</button>}
      </div>
      <p className="text-xs text-gray-500">{resultCount} propert{resultCount !== 1 ? 'ies' : 'y'} found</p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Price per night</h4>
        <input type="range" min={0} max={50000} step={500} value={filters.maxPrice}
          onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#003580]" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>₹0</span>
          <span className="font-semibold text-gray-700">up to ₹{filters.maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Star rating</h4>
        {[5, 4, 3, 2, 1].map(star => (
          <label key={star} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={filters.stars.includes(star)}
              onChange={() => onChange({ ...filters, stars: toggle(filters.stars, star) })}
              className="w-4 h-4 rounded accent-[#003580]" />
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className={`w-3 h-3 ${i < star ? 'text-[#FDC702]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </span>
            <span className="text-xs text-gray-500">{star} star{star !== 1 ? 's' : ''}</span>
          </label>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property type</h4>
        {PROPERTY_TYPES.map(type => (
          <label key={type.value} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={filters.types.includes(type.value)}
              onChange={() => onChange({ ...filters, types: toggle(filters.types, type.value) })}
              className="w-4 h-4 rounded accent-[#003580]" />
            <span className="text-sm">{type.icon}</span>
            <span className="text-xs text-gray-600">{type.label}</span>
          </label>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Amenities</h4>
        {AMENITY_OPTIONS.map(amenity => (
          <label key={amenity} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={filters.amenities.includes(amenity)}
              onChange={() => onChange({ ...filters, amenities: toggle(filters.amenities, amenity) })}
              className="w-4 h-4 rounded accent-[#003580]" />
            <span className="text-xs text-gray-600">{amenity}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}

// ── Featured property card (landing page) ─────────────────────────────────────

function FeaturedCard({ property, onView, deal }: {
  property: SearchResult; onView: () => void; deal?: boolean;
}) {
  const price = Number(property.min_price ?? 0);
  const original = deal ? Math.round(price * 1.18) : 0;

  return (
    <div
      onClick={onView}
      className="group cursor-pointer bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow shrink-0 w-56"
    >
      <div className="relative h-40 overflow-hidden bg-gray-100">
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏨</div>
        )}
        {deal && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            Deal
          </span>
        )}
        {property.star_rating && (
          <span className="absolute bottom-2 right-2 bg-[#003580] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {property.star_rating}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{property.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{property.city}</p>
        <div className="mt-2">
          {deal && original > 0 && (
            <p className="text-xs text-gray-400 line-through">{formatINR(original)}</p>
          )}
          <p className="text-sm font-bold text-gray-900">
            {formatINR(price)}
            <span className="text-xs font-normal text-gray-400"> /night</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Search Page ──────────────────────────────────────────────────────────

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { searches, addSearch } = useRecentSearches();

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [checkin,  setCheckin]  = useState(searchParams.get('checkin')  ?? todayStr());
  const [checkout, setCheckout] = useState(searchParams.get('checkout') ?? tomorrowStr());
  const [adults,   setAdults]   = useState(Number(searchParams.get('adults') ?? 2));
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS);
  const [sort,     setSort]     = useState<SortKey>('recommended');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const destInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  const activeDestination = searchParams.get('destination');
  const activeCheckin     = searchParams.get('checkin')  ?? checkin;
  const activeCheckout    = searchParams.get('checkout') ?? checkout;
  const activeAdults      = Number(searchParams.get('adults') ?? adults);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        destInputRef.current && !destInputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['search', searchParams.toString()],
    queryFn:  () => propertiesApi.search({ destination: activeDestination!, checkin: activeCheckin, checkout: activeCheckout, adults: activeAdults }),
    enabled:  !!activeDestination,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-properties'],
    queryFn:  () => propertiesApi.getFeatured(),
    enabled:  !activeDestination,
    staleTime: 1000 * 60 * 10,
  });

  const featured: SearchResult[] = featuredData?.data ?? [];
  const homesLove = featured.slice(0, 4);
  const deals     = featured.slice(4, 8).length > 0 ? featured.slice(4, 8) : featured.slice(0, 4);

  const allResults: SearchResult[] = data?.data ?? [];

  const filteredAndSorted = useMemo(() => {
    let results = [...allResults];
    if (filters.types.length > 0)     results = results.filter(p => filters.types.includes(p.category));
    if (filters.stars.length > 0)     results = results.filter(p => p.star_rating !== null && filters.stars.includes(Math.round(p.star_rating)));
    if (filters.amenities.length > 0) results = results.filter(p => {
      const amenities = Array.isArray(p.amenities) ? (p.amenities as string[]) : [];
      return filters.amenities.every(fa => amenities.some(a => a.toLowerCase().includes(fa.toLowerCase())));
    });
    if (filters.maxPrice < 50000) results = results.filter(p => Number(p.min_price ?? 0) <= filters.maxPrice);
    switch (sort) {
      case 'price_asc':   results.sort((a, b) => Number(a.min_price ?? 0) - Number(b.min_price ?? 0)); break;
      case 'price_desc':  results.sort((a, b) => Number(b.min_price ?? 0) - Number(a.min_price ?? 0)); break;
      case 'rating_desc': results.sort((a, b) => (b.star_rating ?? 0) - (a.star_rating ?? 0)); break;
    }
    return results;
  }, [allResults, filters, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    addSearch({ destination, checkin, checkout, adults });
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    setDropdownOpen(false);
    setSearchParams({ destination, checkin, checkout, adults: String(adults) });
  };

  const triggerSearch = (dest: string, opts?: { checkin?: string; checkout?: string; adults?: number }) => {
    const c  = opts?.checkin  ?? checkin;
    const co = opts?.checkout ?? checkout;
    const a  = opts?.adults   ?? adults;
    setDestination(dest);
    addSearch({ destination: dest, checkin: c, checkout: co, adults: a });
    setFilters(DEFAULT_FILTERS);
    setSort('recommended');
    setDropdownOpen(false);
    setSearchParams({ destination: dest, checkin: c, checkout: co, adults: String(a) });
  };

  const recentThree = searches.slice(0, 3);
  const weekendLabel = getWeekendLabel();

  return (
    <div className="min-h-screen bg-[#f2f6fa] flex flex-col">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative py-16"
        style={{ background: 'linear-gradient(135deg, #003580 0%, #0057b8 60%, #1a73e8 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
              Find your next stay
            </h1>
            <p className="text-blue-200 text-base md:text-lg">
              Search low prices on hotels, homes and much more…
            </p>
          </div>

        {/* Search card with yellow border */}
        <form
          onSubmit={handleSearch}
          className="w-full rounded-2xl shadow-2xl"
          style={{ background: '#FFCC00', padding: '3px' }}
        >
          <div className="bg-white rounded-xl p-3 flex flex-wrap gap-2 items-end">
            {/* Destination + dropdown */}
            <div className="flex-1 min-w-[180px] relative">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                🛏 Destination
              </label>
              <input
                ref={destInputRef}
                value={destination}
                onChange={e => { setDestination(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Where are you going?"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#003580] transition-colors"
              />

              {/* Dropdown */}
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                >
                  {recentThree.length > 0 && (
                    <>
                      <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Your recent searches
                      </p>
                      {recentThree.map(s => (
                        <button
                          key={s.savedAt}
                          type="button"
                          onClick={() => triggerSearch(s.destination, { checkin: s.checkin, checkout: s.checkout, adults: s.adults })}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-gray-400 text-sm">🕐</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{s.destination}</p>
                            <p className="text-xs text-gray-400">
                              {formatDate(s.checkin)} – {formatDate(s.checkout)} · {s.adults} adult{s.adults !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gray-100 my-1" />
                    </>
                  )}
                  <p className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Trending destinations
                  </p>
                  {TRENDING_CITIES.map(city => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => triggerSearch(city)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="text-gray-400">📍</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{city}</p>
                        <p className="text-xs text-gray-400">India</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                📅 Check-in
              </label>
              <input type="date" value={checkin} min={todayStr()}
                onChange={e => { setCheckin(e.target.value); if (checkout <= e.target.value) setCheckout(e.target.value); }}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors" />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                📅 Check-out
              </label>
              <input type="date" value={checkout} min={checkin}
                onChange={e => setCheckout(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors" />
            </div>

            <div className="min-w-[130px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                👤 Adults
              </label>
              <div className="relative">
                <select
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border-2 border-gray-200 pl-3 pr-8 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#003580] transition-colors bg-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} adult{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">▾</span>
              </div>
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
      </div>

      {/* ── Landing dashboard ─────────────────────────────────────────────── */}
      {!activeDestination && (
        <div className="max-w-7xl mx-auto w-full px-4 py-10 space-y-14 flex-1">

          {/* Recent searches */}
          {recentThree.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your recent searches</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {recentThree.map(s => (
                  <button
                    key={s.savedAt}
                    onClick={() => triggerSearch(s.destination, { checkin: s.checkin, checkout: s.checkout, adults: s.adults })}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-[#003580]/30 transition-all text-left"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {CITY_THUMB[s.destination] ? (
                        <img src={CITY_THUMB[s.destination]} alt={s.destination} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛏</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.destination}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>📅</span>
                        {formatDate(s.checkin)} – {formatDate(s.checkout)}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>👤</span>
                        {s.adults} people
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Explore India */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Explore India</h2>
            <p className="text-sm text-gray-500 mb-5">These popular destinations have a lot to offer</p>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {EXPLORE_CITIES.map(dest => (
                <button
                  key={dest.city}
                  onClick={() => triggerSearch(dest.city)}
                  className="group shrink-0 text-left"
                >
                  <div className="w-40 h-28 rounded-xl overflow-hidden bg-gray-200 mb-2">
                    <img
                      src={dest.image}
                      alt={dest.city}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{dest.city}</p>
                  <p className="text-xs text-gray-400">{dest.count} properties</p>
                </button>
              ))}
            </div>
          </section>

          {/* Homes guests love */}
          {homesLove.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Homes guests love</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Top-rated properties across India</p>
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {homesLove.map(p => (
                  <FeaturedCard
                    key={p.id}
                    property={p}
                    onView={() => navigate(`/property/${p.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Deals for the weekend */}
          {deals.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-1">Deals for the weekend</h2>
              <p className="text-sm text-gray-500 mb-5">Save on stays for {weekendLabel}</p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {deals.map(p => (
                  <FeaturedCard
                    key={p.id}
                    property={p}
                    deal
                    onView={() => navigate(`/property/${p.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Trending destinations mosaic */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Trending destinations</h2>
            <p className="text-sm text-gray-500 mb-5">Travellers searching for India also booked these</p>
            <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[400px]">
              {/* New Delhi — tall vertical tile, col 1 full height */}
              <button
                onClick={() => triggerSearch(TRENDING[0].city)}
                className="group row-span-2 relative rounded-2xl overflow-hidden"
              >
                <img src={TRENDING[0].image} alt={TRENDING[0].city}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 text-left">
                  <p className="text-white font-bold text-xl">{TRENDING[0].city} 🇮🇳</p>
                </div>
              </button>
              {/* Right 2 columns — 2×2 grid (Bengaluru, Mumbai, Varanasi, Rishikesh) */}
              {TRENDING.slice(1).map(t => (
                <button
                  key={t.city}
                  onClick={() => triggerSearch(t.city)}
                  className="group relative rounded-2xl overflow-hidden"
                >
                  <img src={t.image} alt={t.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-left">
                    <p className="text-white font-bold text-sm">{t.city} 🇮🇳</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Offers */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-5">Offers — Deals, promotions and more</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #003580 0%, #0057b8 100%)' }}>
                <div>
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Limited time</span>
                  <h3 className="text-white text-xl font-bold mt-1">Save 20% on Manali stays</h3>
                  <p className="text-blue-200 text-sm mt-1">Book before 31st May 2026</p>
                </div>
                <button onClick={() => triggerSearch('Manali')}
                  className="mt-4 self-start bg-[#FFCC00] text-gray-900 text-sm font-bold px-5 py-2 rounded-lg hover:bg-[#E6B800] transition-colors">
                  Explore deals →
                </button>
                <div className="absolute right-4 top-4 text-5xl opacity-20 select-none">⛰</div>
              </div>
              <div className="relative rounded-2xl overflow-hidden p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #00875A 0%, #00b87c 100%)' }}>
                <div>
                  <span className="text-[10px] font-bold text-green-200 uppercase tracking-widest">Free cancellation</span>
                  <h3 className="text-white text-xl font-bold mt-1">Flexible Goa beach getaway</h3>
                  <p className="text-green-200 text-sm mt-1">Cancel anytime, no fees</p>
                </div>
                <button onClick={() => triggerSearch('Goa')}
                  className="mt-4 self-start bg-white text-green-800 text-sm font-bold px-5 py-2 rounded-lg hover:bg-green-50 transition-colors">
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
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-3">{perk.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{perk.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── Search results ────────────────────────────────────────────────── */}
      {activeDestination && (
        <div className="flex-1">
          <PageWrapper>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Properties in <span className="text-[#003580]">{activeDestination}</span>
                </h2>
                {!isLoading && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {filteredAndSorted.length} of {allResults.length} propert{allResults.length !== 1 ? 'ies' : 'y'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:block">Sort by:</span>
                <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#003580] transition-colors">
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {isLoading && <div className="py-24 flex justify-center"><Spinner size="lg" /></div>}
            {isError   && <ErrorBanner message={getApiError(error)} />}

            {!isLoading && !isError && (
              <div className="flex gap-6 items-start">
                <FilterSidebar filters={filters} onChange={setFilters} onReset={() => setFilters(DEFAULT_FILTERS)} resultCount={filteredAndSorted.length} />
                <div className="flex-1 min-w-0">
                  {filteredAndSorted.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="text-gray-600 font-medium">No properties match your filters</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting or resetting your filters</p>
                      <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-4 text-sm text-[#003580] hover:underline">
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredAndSorted.map(p => (
                        <PropertyCard key={p.id} property={p} checkin={activeCheckin} checkout={activeCheckout} adults={activeAdults} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </PageWrapper>
        </div>
      )}

      <Footer />
    </div>
  );
}
