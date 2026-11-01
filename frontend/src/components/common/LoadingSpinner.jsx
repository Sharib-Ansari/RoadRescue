import React from 'react';

const LoadingSpinner = ({ size = 'md', message = '', color = 'var(--accent-primary, #EF4444)' }) => {
  const sizeMap = {
    sm: 18,
    md: 28,
    lg: 44
  };

  const dimension = sizeMap[size] || 28;
  const borderWidth = size === 'sm' ? 2 : size === 'lg' ? 4 : 3;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem'
      }}
    >
      <div
        style={{
          width: `${dimension}px`,
          height: `${dimension}px`,
          border: `${borderWidth}px solid rgba(255, 255, 255, 0.1)`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {message && (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #9CA3AF)' }}>
          {message}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
