import React from 'react';
import { getStatusColor, getStatusLabel } from '../../utils/helpers';

const StatusBadge = ({ status, label, size = 'md' }) => {
  const displayLabel = label || getStatusLabel(status);
  const color = getStatusColor(status);

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: isSmall ? '0.2rem 0.5rem' : '0.3rem 0.75rem',
        fontSize: isSmall ? '0.75rem' : '0.8125rem',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: `${color}1A`, // ~10% opacity
        color: color,
        border: `1px solid ${color}40`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: color
        }}
      />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
