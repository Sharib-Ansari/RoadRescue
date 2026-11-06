import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  PlayCircle,
  CheckCircle2,
  DollarSign,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getInitials } from '../utils/helpers';
import LogoutModal from '../components/common/LogoutModal';
import './DashboardLayout.css';
import './MechanicDashboardLayout.css';

const MechanicDashboardLayout = ({
  children,
  title = 'Mechanic Dashboard',
  isOnline = true,
  onToggleOnline
}) => {
  // Mobile drawer open state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop sidebar collapse state (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('roadrescue_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('roadrescue_sidebar_collapsed', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleOpenLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const handleCloseLogoutModal = () => {
    if (isLoggingOut) return;
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (socket) {
        try {
          socket.removeAllListeners();
          socket.disconnect();
        } catch (sockErr) {
          console.warn('Socket disconnect error during logout:', sockErr);
        }
      }
      await logout();
    } catch (err) {
      console.warn('Logout error, proceeding with redirect:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Overview', path: '/mechanic/dashboard', icon: LayoutDashboard },
    { name: 'Service Requests', path: '/mechanic/dashboard#requests', icon: Inbox },
    { name: 'Active Jobs', path: '/mechanic/dashboard#active-jobs', icon: PlayCircle },
    { name: 'Completed Jobs', path: '/mechanic/dashboard#completed', icon: CheckCircle2 },
    { name: 'Earnings', path: '/mechanic/dashboard#earnings', icon: DollarSign },
    { name: 'My Profile', path: '/profile', icon: User }
  ];

  const currentNav = navItems.find((item) => {
    if (item.path.includes('#')) {
      return location.pathname === '/mechanic/dashboard' && location.hash === item.path.substring(item.path.indexOf('#'));
    }
    return location.pathname === item.path && (!location.hash || location.hash === '');
  });

  const displayTitle = title || currentNav?.name || 'Mechanic Portal';

  return (
    <div className="dashboard-layout mechanic-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/mechanic/dashboard" className="brand-link" onClick={() => setSidebarOpen(false)} title="RoadRescue Pro">
            <div className="brand-icon-wrapper mechanic-brand-icon">
              <Wrench size={20} />
            </div>
            <div className="brand-title">
              Road<span>Rescue</span>
              <span className="brand-portal-tag">PRO PARTNER</span>
            </div>
          </NavLink>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Dispatch Status Banner */}
        <div className="mech-sidebar-status" title={isOnline ? 'Online • Accepting Requests' : 'Offline • Paused'}>
          <div className="mech-status-header">
            <Radio size={14} className={isOnline ? 'mech-live-ping' : ''} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              DISPATCH STATUS
            </span>
          </div>
          <div className="mech-status-toggle-wrap">
            <span className={`mech-status-text ${isOnline ? 'online' : 'offline'}`}>
              <span className={`status-indicator-dot ${isOnline ? 'online' : 'offline'}`} />
              {isOnline ? 'Online • Accepting' : 'Offline • Paused'}
            </span>
            {onToggleOnline && (
              <button
                type="button"
                className={`mech-toggle-btn ${isOnline ? 'on' : 'off'}`}
                onClick={onToggleOnline}
                title="Toggle Online/Offline Status"
              >
                <span className="mech-toggle-handle" />
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isHashLink = item.path.includes('#');
            const isActive = isHashLink
              ? location.pathname === '/mechanic/dashboard' && location.hash === item.path.substring(item.path.indexOf('#'))
              : location.pathname === item.path && (!location.hash || location.hash === '');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={item.name}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="btn-logout"
            onClick={handleOpenLogoutModal}
            title="Sign Out"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
          <div className="app-version">RoadRescue Partner Network v1.0</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <header className="dashboard-header">
          <div className="header-left">
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={handleToggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Menu size={20} />
            </button>

            <div className="header-breadcrumb">
              <span>RoadRescue Pro</span>
              <ChevronRight size={14} />
              <span className="breadcrumb-current">{displayTitle}</span>
            </div>
          </div>

          <div className="header-right">
            {/* Online Pill in Header */}
            <div
              className={`header-status-pill ${isOnline ? 'online' : 'offline'}`}
              onClick={onToggleOnline}
              style={{ cursor: onToggleOnline ? 'pointer' : 'default' }}
              title="Click to toggle availability"
            >
              <span className={`status-indicator-dot ${isOnline ? 'online' : 'offline'}`} />
              <span>{isOnline ? 'Online for Dispatch' : 'Offline'}</span>
            </div>

            <button
              type="button"
              className="header-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="notification-badge" />
            </button>

            <NavLink to="/profile" className="user-profile-summary">
              <div className="user-avatar mechanic-avatar">
                {getInitials(user?.name)}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Mechanic Partner'}</span>
                <span className="user-role">
                  {user?.workshopName || 'Certified Technician'}
                </span>
              </div>
            </NavLink>
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleCloseLogoutModal}
        onConfirm={handleConfirmLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
};

export default MechanicDashboardLayout;
