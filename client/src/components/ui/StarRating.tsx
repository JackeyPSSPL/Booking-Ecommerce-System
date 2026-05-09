interface StarRatingProps {
  stars:      number;       // 0-5, decimals supported
  size?:      'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export default function StarRating({ stars, size = 'md', showNumber = false }: StarRatingProps) {
  const filled = Math.floor(stars);
  const half   = stars - filled >= 0.5;

  return (
    <span className={`inline-flex items-center gap-0.5 ${sizes[size]}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const active = i < filled || (i === filled && half);
        return (
          <span key={i} className={active ? 'text-yellow-400' : 'text-gray-200'}>
            ★
          </span>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-gray-600 font-medium">{stars.toFixed(1)}</span>
      )}
    </span>
  );
}
