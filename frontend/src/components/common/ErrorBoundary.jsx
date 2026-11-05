import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: '2rem',
            background: 'var(--card-bg, #1e293b)',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            textAlign: 'center',
            margin: '1.5rem 0',
            color: '#f8fafc'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {this.props.title || 'Component Display Error'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
            {this.props.message || 'An unexpected error occurred while rendering this module. You can try refreshing it.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          >
            <RotateCcw size={14} /> Try Reloading
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
