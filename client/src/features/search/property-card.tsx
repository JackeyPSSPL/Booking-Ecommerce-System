import { Link } from 'react-router-dom';
import { SearchResult } from '../../types';
import { formatPrice } from '../../utils/format';

interface PropertyCardProps {
  property: SearchResult;
  checkin: string;
  checkout: string;
  adults: number;
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶',
  pool: '🏊',
  parking: '🅿️',
  gym: '🏋',
  restaurant: '🍽',
  spa: '💆',
  ac: '❄️',
  breakfast: '🍳',
  bar: '🍸',
  pets: '🐾',
};

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < rating ? 'text-[#FDC702]' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function PropertyCard({ property, checkin, checkout, adults }: PropertyCardProps) {
  const params = new URLSearchParams({ checkin, checkout, adults: String(adults) });

  const amenities: string[] = Array.isArray(property.amenities)
    ? (property.amenities as string[])
    : [];

  const visibleAmenities = amenities.slice(0, 3);
  const hasFreeCancellation = amenities.some(a => a.toLowerCase().includes('cancel'));

  return (
    <Link
      to={`/property/${property.id}?${params.toString()}`}
      className="group block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-2">
            <span className="text-4xl">🏨</span>
            <span className="text-xs">No photo</span>
          </div>
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
          {property.category.toLowerCase()}
        </span>

        {/* Free cancellation badge */}
        {hasFreeCancellation && (
          <span className="absolute top-3 right-3 bg-[#00875A] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Free cancel
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Star rating */}
        {property.star_rating !== null && (
          <div className="mb-1.5">
            <StarRow rating={Math.round(property.star_rating)} />
          </div>
        )}

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-0.5">
          {property.name}
        </h3>

        {/* City */}
        <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1">
          <span>📍</span>
          {property.city}
        </p>

        {/* Amenity pills */}
        {visibleAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {visibleAmenities.map(amenity => {
              const key = amenity.toLowerCase();
              const icon = Object.entries(AMENITY_ICONS).find(([k]) => key.includes(k))?.[1] ?? '✓';
              return (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5"
                >
                  {icon} {amenity}
                </span>
              );
            })}
            {amenities.length > 3 && (
              <span className="text-[10px] text-gray-400 px-1 py-0.5">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {property.min_price && (
          <div className="flex items-baseline justify-between border-t border-gray-50 pt-3">
            <div>
              <span className="text-[10px] text-gray-400 block">from</span>
              <span className="text-base font-extrabold text-[#003580]">
                {formatPrice(property.min_price)}
              </span>
              <span className="text-gray-400 font-normal text-xs"> / night</span>
            </div>
            <span className="text-xs font-semibold text-[#003580] bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-[#003580] group-hover:text-white transition-colors">
              View →
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
