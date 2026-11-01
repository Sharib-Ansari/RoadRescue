import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  rating = 0,
  reviewCount,
  size = 16,
  showText = true,
  maxStars = 5
}) => {
  const roundedRating = Math.round(Number(rating) * 10) / 10;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = roundedRating >= starValue;
          const isHalf = !isFilled && roundedRating >= starValue - 0.5;

          return (
            <span key={index} style={{ position: 'relative', display: 'inline-block' }}>
              <Star
                size={size}
                fill={isFilled ? '#F59E0B' : isHalf ? 'url(#halfStarGrad)' : 'none'}
                stroke={isFilled || isHalf ? '#F59E0B' : '#6B7280'}
                strokeWidth={1.8}
              />
            </span>
          );
        })}
      </div>

      {showText && (
        <span
          style={{
            marginLeft: '0.25rem',
            fontSize: `${Math.max(12, size - 2)}px`,
            fontWeight: 600,
            color: 'var(--text-primary, #E5E7EB)'
          }}
        >
          {roundedRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && reviewCount !== null && (
        <span
          style={{
            fontSize: `${Math.max(12, size - 3)}px`,
            color: 'var(--text-secondary, #9CA3AF)',
            marginLeft: '2px'
          }}
        >
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default StarRating;
