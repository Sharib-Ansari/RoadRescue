import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  ShieldAlert,
  PlusCircle,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';
import './DashboardLayout.css';
import './MechanicDashboardLayout.css';

const ShopDashboardLayout = ({
  children,
  title = 'Shop Dashboard'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/shop/dashboard', icon: LayoutDashboard },
    { name: 'Products & Inventory', path: '/shop/products', icon: Package },
    { name: 'Orders Management', path: '/shop/orders', icon: ShoppingBag },
    { name: 'Public Marketplace', path: '/spare-parts', icon: Store },
    { name: 'My Profile', path: '/profile', icon: User }
  ];

  const currentNav = navItems.find((item) =>
    location.pathname === item.path || (item.path !== '/shop/dashboard' && location.pathname.startsWith(item.path))
  );

  const displayTitle = title || currentNav?.name || 'Shop Portal';

  return (
    <div className="dashboard-layout mechanic-layout">
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/shop/dashboard" className="brand-link" onClick={() => setSidebarOpen(false)}>
            <div className="brand-icon-wrapper" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
              <Store size={20} color="#FFFFFF" />
            </div>
            <div className="brand-title">
              Road<span>Rescue</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.08em',
                  color: '#60A5FA',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  display: 'block'
                }}
              >
                Shop Partner
              </span>
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

        {/* User Card */}
        <div className="sidebar-user-card" style={{ borderLeft: '3px solid #3B82F6' }}>
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }}>
            {getInitials(user?.name || 'Shop Owner')}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Shop Owner'}</div>
            <div className="user-role" style={{ color: '#93C5FD' }}>
              {user?.shop?.name || 'Spare Parts Store'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Shop Portal</div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={19} className="nav-icon" />
                    <span className="nav-label">{item.name}</span>
                    {isActive && <ChevronRight size={14} className="nav-chevron" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Logout */}
        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <div className="page-breadcrumb">
              <span className="breadcrumb-root">Shop Portal</span>
              <ChevronRight size={14} className="breadcrumb-sep" />
              <h1 className="breadcrumb-current">{displayTitle}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <NavLink
              to="/shop/products?new=1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid #3B82F6',
                color: '#60A5FA',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <PlusCircle size={15} />
              <span>Add Product</span>
            </NavLink>

            <div className="topbar-user">
              <div className="topbar-avatar" style={{ background: 'linear-gradient(135deg, #1E40AF, #3B82F6)' }}>
                {getInitials(user?.name || 'SO')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
};

export default ShopDashboardLayout;
