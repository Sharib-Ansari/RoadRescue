import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-primary, #111318)',
          color: 'var(--text-primary, #E5E7EB)',
          gap: '1rem'
        }}
      >
        <LoadingSpinner size="lg" message="Loading RoadRescue..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || user.accountType || 'customer').toLowerCase();
    const hasPermission = allowedRoles.some(
      (role) => role.toLowerCase() === userRole
    );

    if (!hasPermission) {
      // Redirect users to their respective home dashboard
      if (userRole === 'mechanic') {
        return <Navigate to="/mechanic/dashboard" replace />;
      } else if (userRole === 'shop_owner') {
        return <Navigate to="/shop/dashboard" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
