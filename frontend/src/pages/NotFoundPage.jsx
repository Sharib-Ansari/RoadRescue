import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Home, LayoutDashboard, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#111318',
        color: '#E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient red glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#1C2028',
          border: '1px solid #303641',
          borderRadius: '16px',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5), 0 0 25px rgba(239, 68, 68, 0.08)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Animated Icon Badge */}
        <div
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.75rem',
            color: '#EF4444',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.25)'
          }}
        >
          <Wrench size={36} />
        </div>

        {/* 404 Large Heading */}
        <h1
          style={{
            fontSize: '5.5rem',
            fontWeight: '900',
            lineHeight: '1',
            letterSpacing: '-0.03em',
            color: '#EF4444',
            margin: '0 0 0.5rem',
            textShadow: '0 0 35px rgba(239, 68, 68, 0.45)'
          }}
        >
          404
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#F59E0B',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            marginBottom: '1.25rem'
          }}
        >
          <AlertTriangle size={15} />
          <span>Dead End Reached</span>
        </div>

        <h2
          style={{
            fontSize: '1.65rem',
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: '0.85rem',
            letterSpacing: '-0.02em'
          }}
        >
          Looks like you&apos;re lost on the road
        </h2>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#9CA3AF',
            lineHeight: '1.6',
            marginBottom: '2.5rem',
            maxWidth: '440px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          The page or emergency coordinate you are navigating to does not exist, has been moved,
          or the route is temporarily closed for maintenance.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '0.9375rem',
              padding: '0.8rem 1.6rem',
              borderRadius: '10px',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#DC2626';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#EF4444';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Home size={18} />
            <span>Back to Home</span>
          </Link>

          {isAuthenticated ? (
            <Link
              to={(user?.role || user?.accountType) === 'mechanic' ? '/mechanic/dashboard' : '/dashboard'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#282E3D',
                border: '1px solid #303641',
                color: '#E5E7EB',
                fontWeight: '500',
                fontSize: '0.9375rem',
                padding: '0.8rem 1.6rem',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#9CA3AF';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#303641';
                e.currentTarget.style.color = '#E5E7EB';
              }}
            >
              <LayoutDashboard size={18} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#282E3D',
                border: '1px solid #303641',
                color: '#E5E7EB',
                fontWeight: '500',
                fontSize: '0.9375rem',
                padding: '0.8rem 1.6rem',
                borderRadius: '10px',
                textDecoration: 'none',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#9CA3AF';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#303641';
                e.currentTarget.style.color = '#E5E7EB';
              }}
            >
              <ArrowLeft size={18} />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        {/* Brand signature */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #303641',
            fontSize: '0.8125rem',
            color: '#6B7280'
          }}
        >
          <span>RoadRescue • Smart On-Demand Roadside Assistance</span>
        </div>
      </div>
    </div>
  );
}
