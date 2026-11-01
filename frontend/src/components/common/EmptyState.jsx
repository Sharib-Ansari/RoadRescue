import React from 'react';

const EmptyState = ({
  icon: Icon,
  title = 'No items found',
  description = 'There is currently no data to display.',
  actionLabel,
  onAction,
  actionIcon: ActionIcon
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem',
        borderRadius: 'var(--radius-lg, 16px)',
        backgroundColor: 'var(--bg-card, #1C2028)',
        border: '1px dashed var(--border-color, #303641)',
        margin: '1.5rem 0'
      }}
    >
      {Icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-primary, #EF4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          <Icon size={32} />
        </div>
      )}

      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-primary, #E5E7EB)',
          marginBottom: '0.5rem'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9375rem',
          color: 'var(--text-secondary, #9CA3AF)',
          maxWidth: '440px',
          marginBottom: actionLabel ? '1.5rem' : '0'
        }}
      >
        {description}
      </p>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-primary"
        >
          {ActionIcon && <ActionIcon size={18} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
