import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Wrench,
  Package,
  Car,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldAlert,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCart } from '../context/CartContext';
import { useVehicles } from '../context/VehicleContext';
import { getInitials } from '../utils/helpers';
import LogoutModal from '../components/common/LogoutModal';
import './DashboardLayout.css';

const DashboardLayout = ({ children, title = 'Dashboard' }) => {
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
  const { totalItems } = useCart();
  const { selectedVehicle } = useVehicles();
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
      // Disconnect socket and clean up listeners immediately
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
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Emergency SOS', path: '/emergency', icon: AlertTriangle, isEmergency: true },
    { name: 'Find Mechanic', path: '/mechanics', icon: Wrench },
    { name: 'Spare Parts', path: '/spare-parts', icon: Package, badge: totalItems > 0 ? totalItems : null },
    { name: 'My Orders', path: '/my-orders', icon: ShoppingBag },
    { name: 'My Vehicles', path: '/vehicles', icon: Car },
    { name: 'Profile', path: '/profile', icon: User }
  ];

  const currentNav = navItems.find((item) =>
    location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  );

  const displayTitle = title || currentNav?.name || 'Dashboard';

  return (
    <div className="dashboard-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/dashboard" className="brand-link" onClick={() => setSidebarOpen(false)} title="RoadRescue">
            <div className="brand-icon-wrapper">
              <ShieldAlert size={20} />
            </div>
            <div className="brand-title">
              Road<span>Rescue</span>
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

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isEmergency = item.isEmergency;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isEmergency ? 'nav-emergency' : ''} ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
                title={item.name}
              >
                <Icon size={19} />
                <span>{item.name}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
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
          <div className="app-version">RoadRescue v1.0 • 24/7 Assist</div>
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
              <span>RoadRescue</span>
              <ChevronRight size={14} />
              <span className="breadcrumb-current">{displayTitle}</span>
            </div>
          </div>

          <div className="header-right">
            {selectedVehicle && (
              <div className="header-vehicle-badge" title="Active Selected Vehicle">
                <Car size={15} color="var(--accent-secondary)" />
                <span>
                  <strong>{selectedVehicle.make} {selectedVehicle.model}</strong> ({selectedVehicle.registrationNumber})
                </span>
              </div>
            )}

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
              <div className="user-avatar">
                {getInitials(user?.name)}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Road User'}</span>
                <span className="user-role">{user?.accountType || 'Member'}</span>
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

export default DashboardLayout;
