import { Link } from 'react-router-dom';
import { SearchResult } from '../../types';
import { formatPrice } from '../../utils/format';

interface PropertyCardProps {
  property: SearchResult;
  checkin: string;
  checkout: string;
  adults: number;
}

export default function PropertyCard({ property, checkin, checkout, adults }: PropertyCardProps) {
  const params = new URLSearchParams({ checkin, checkout, adults: String(adults) });
  return (
    <Link
      to={`/property/${property.id}?${params.toString()}`}
      className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={property.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{property.name}</h3>
            <p className="text-sm text-gray-500">{property.city}</p>
          </div>
          {property.star_rating !== null && (
            <span className="flex items-center gap-0.5 text-sm text-yellow-500 shrink-0">
              ★ {property.star_rating}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 capitalize">{property.category.toLowerCase()}</p>
        {property.min_price && (
          <p className="mt-3 font-semibold text-primary-500">
            {formatPrice(property.min_price)}{' '}
            <span className="text-gray-400 font-normal text-xs">/ night</span>
          </p>
        )}
      </div>
    </Link>
  );
}
