import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Wrench,
  Package,
  Car,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Navigation,
  RotateCcw,
  ShoppingBag,
  RefreshCw,
  Loader2,
  XCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../utils/helpers';
import { authApi } from '../utils/api';

/* ─── tiny helpers ─────────────────────────────────────── */

const ACTIVE_STATUSES = ['submitted', 'accepted', 'on_the_way', 'arrived', 'repair_in_progress'];
const TRACKABLE_STATUSES = ['accepted', 'on_the_way', 'arrived', 'repair_in_progress'];

function humanStatus(raw = '') {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function orderStatusColor(status) {
  const map = {
    placed: '#FBBF24',
    confirmed: '#60A5FA',
    preparing: '#A78BFA',
    out_for_delivery: '#34D399',
    ready_for_pickup: '#34D399',
    completed: '#10B981',
    cancelled: '#EF4444'
  };
  return map[status] || '#9CA3AF';
}

/* ─── stat card ─────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div
      className="card"
      style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          {label}
        </div>
        {loading ? (
          <div style={{ width: '2rem', height: '1.5rem', background: '#2B313E', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const { user } = useAuth();
  const { vehicles, selectedVehicle } = useVehicles();

  /* ── state ── */
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const [serviceRequests, setServiceRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  const [activeOngoingRequest, setActiveOngoingRequest] = useState(null);

  /* ── fetch aggregated stats from MongoDB ── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await authApi.getCustomerDashboard();
      if (res?.status === 'success' && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      setStatsError('Could not load dashboard statistics.');
      console.warn('Dashboard stats error:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /* ── fetch service requests ── */
  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const response = await authApi.getMyRequests();
      if (response?.success && Array.isArray(response.requests)) {
        const mapped = response.requests.map((r) => ({
          id: r.requestId || r.id || r._id,
          rawStatus: r.status,
          serviceType: r.problemCategory,
          mechanicName:
            r.mechanicName || r.mechanicId?.name || 'Awaiting Assignment',
          workshopName:
            r.workshopName ||
            r.mechanicId?.mechanicProfile?.workshopName ||
            'RoadRescue Partner',
          vehicleName: r.vehicleName,
          vehicleReg: r.vehicleReg,
          location: r.location,
          customerCoordinates: r.customerCoordinates,
          date: r.createdAt,
          charge: r.finalCharge || r.estimatedCharge || 0,
          status: humanStatus(r.status)
        }));
        setServiceRequests(mapped);

        // Derive active request from the list (avoid a second API call)
        const active = response.requests.find(
          (r) => ACTIVE_STATUSES.includes(r.status)
        );
        setActiveOngoingRequest(active || null);
      }
    } catch (err) {
      console.warn('Could not fetch service requests:', err.message);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRequests();

    if (window.location.hash === '#history') {
      setTimeout(() => {
        const el = document.getElementById('service-history-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [fetchStats, fetchRequests]);

  /* ── most recent rejected request (for banner) ── */
  const latestRejected =
    !activeOngoingRequest &&
    serviceRequests.length > 0 &&
    serviceRequests[0].rawStatus === 'rejected'
      ? serviceRequests[0]
      : null;

  /* ── stat values ── */
  const totalVehicles = stats?.totalVehicles ?? vehicles.length;
  const activeRequestsCount = stats?.activeRequests ?? 0;
  const completedCount = stats?.completedAssistance ?? 0;
  const totalOrders = stats?.totalOrders ?? 0;
  const recentOrders = stats?.recentOrders ?? [];

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <DashboardLayout title="Dashboard">

      {/* ── Welcome Banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2028 0%, #161A22 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> Active Roadside Protection
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Hello, {user?.name || 'Driver'}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Your roadside emergency network is active and ready 24/7.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { fetchStats(); fetchRequests(); }}
            title="Refresh dashboard"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={16} />
          </button>
          <Link
            to="/emergency"
            className="btn btn-danger btn-lg"
            style={{ boxShadow: 'var(--shadow-glow)' }}
          >
            <AlertTriangle size={20} />
            Emergency SOS
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div
        className="grid grid-cols-4 gap-4"
        style={{ marginBottom: '1.5rem' }}
      >
        <StatCard
          icon={Car}
          label="Registered Vehicles"
          value={totalVehicles}
          color="#8B5CF6"
          loading={statsLoading}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Requests"
          value={activeRequestsCount}
          color="#EF4444"
          loading={statsLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed Assistance"
          value={completedCount}
          color="#10B981"
          loading={statsLoading}
        />
        <StatCard
          icon={ShoppingBag}
          label="Spare Parts Orders"
          value={totalOrders}
          color="#3B82F6"
          loading={statsLoading}
        />
      </div>

      {/* ── Stats Error ── */}
      {statsError && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            color: '#FCA5A5',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <XCircle size={16} /> {statsError}
        </div>
      )}

      {/* ── Active Ongoing Roadside Request Alert ── */}
      {activeOngoingRequest && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#eab308',
                flexShrink: 0,
                boxShadow: '0 0 8px #eab308'
              }}
            />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Active Ticket #{activeOngoingRequest.requestId} — {humanStatus(activeOngoingRequest.status)}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#cbd5e1' }}>
                {activeOngoingRequest.vehicleName} &bull;{' '}
                {activeOngoingRequest.problemCategory} &bull;{' '}
                {activeOngoingRequest.location}
              </p>
              {activeOngoingRequest.mechanicName && (
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Mechanic: <strong style={{ color: '#e2e8f0' }}>{activeOngoingRequest.mechanicName}</strong>
                </p>
              )}
            </div>
          </div>

          {TRACKABLE_STATUSES.includes(activeOngoingRequest.status) ? (
            <Link
              to={`/tracking/${activeOngoingRequest.requestId}`}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Navigation size={16} /> Open Live Tracking
            </Link>
          ) : activeOngoingRequest.status === 'submitted' ? (
            <Link
              to={`/tracking/${activeOngoingRequest.requestId}`}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              View Dispatch Status <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      )}

      {/* ── Rejected Request Banner ── */}
      {latestRejected && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Request #{latestRejected.id} — Declined by Technician
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#fca5a5' }}>
                The mechanic was unable to assist with {latestRejected.serviceType}. Please find another specialist.
              </p>
            </div>
          </div>
          <Link
            to="/mechanics"
            state={{
              coordinates: latestRejected.customerCoordinates,
              location: latestRejected.location,
              problemCategory: latestRejected.serviceType,
              vehicleName: latestRejected.vehicleName,
              vehicleReg: latestRejected.vehicleReg
            }}
            className="btn btn-danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Find Another Mechanic
          </Link>
        </div>
      )}

      {/* ── Quick Action Cards ── */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '1.75rem' }}>
        <Link to="/emergency" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-primary)' }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Emergency Assist</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>One-click instant GPS roadside dispatch</p>
        </Link>

        <Link to="/mechanics" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-secondary)', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-secondary)' }}>
              <Wrench size={20} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Find Mechanic</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Browse rated nearby workshops</p>
        </Link>

        <Link to="/spare-parts" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #10B981', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Package size={20} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Spare Parts</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Genuine batteries, tyres, engine spares</p>
        </Link>

        <Link to="/vehicles" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
              <Car size={20} />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>My Garage</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {totalVehicles} vehicle{totalVehicles !== 1 ? 's' : ''} enrolled
          </p>
        </Link>
      </div>

      {/* ── 2-Column Grid ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left 2 Cols: Service History + Orders */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Service History */}
          <div className="card" id="service-history-section">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--accent-secondary)" />
                <h3 style={{ fontSize: '1.05rem' }}>Recent Assistance Requests</h3>
              </div>
              <Link
                to="/mechanics"
                style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                New Request <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {requestsLoading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading request history…</p>
                </div>
              ) : serviceRequests.length > 0 ? (
                serviceRequests.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.1rem 1.5rem',
                      borderBottom: idx !== Math.min(serviceRequests.length, 6) - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.serviceType}</span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                        Mechanic: <strong>{item.mechanicName}</strong>
                        {item.workshopName !== 'RoadRescue Partner' && ` (${item.workshopName})`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.vehicleName && <span>{item.vehicleName} &bull; </span>}
                        {formatDate(item.date)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {item.charge > 0 && (
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                          {formatCurrency(item.charge)}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontFamily: 'monospace' }}>
                        #{item.id}
                      </div>

                      {/* Action buttons */}
                      {TRACKABLE_STATUSES.includes(item.rawStatus) && (
                        <Link
                          to={`/tracking/${item.id}`}
                          className="btn btn-sm btn-primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
                        >
                          <Navigation size={12} /> Track Live
                        </Link>
                      )}
                      {item.rawStatus === 'submitted' && (
                        <Link
                          to={`/tracking/${item.id}`}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                        >
                          View Status
                        </Link>
                      )}
                      {item.rawStatus === 'rejected' && (
                        <Link
                          to="/mechanics"
                          state={{
                            coordinates: item.customerCoordinates,
                            location: item.location,
                            problemCategory: item.serviceType,
                            vehicleName: item.vehicleName,
                            vehicleReg: item.vehicleReg
                          }}
                          className="btn btn-sm btn-danger"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
                        >
                          <RotateCcw size={12} /> Find Another
                        </Link>
                      )}
                      {item.rawStatus === 'completed' && (
                        <Link
                          to={`/tracking/${item.id}`}
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--accent-secondary)' }}
                        >
                          Summary
                        </Link>
                      )}
                      {item.rawStatus === 'cancelled' && (
                        <Link
                          to="/emergency"
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--text-muted)' }}
                        >
                          Re-book
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No Service Requests Yet</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                    When you request emergency roadside assistance, your request timeline and tracking will appear here.
                  </p>
                  <Link to="/emergency" className="btn btn-sm btn-primary">Request Assistance</Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Spare Parts Orders */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} color="#3B82F6" />
                <h3 style={{ fontSize: '1.05rem' }}>Recent Spare Parts Orders</h3>
              </div>
              <Link
                to="/my-orders"
                style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                All Orders <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {statsLoading ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading orders…</p>
                </div>
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => (
                  <div
                    key={order.id || order.orderNumber}
                    style={{
                      padding: '1rem 1.5rem',
                      borderBottom: idx !== recentOrders.length - 1 ? '1px solid var(--border-color)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: '#60A5FA'
                          }}
                        >
                          {order.orderNumber}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: `${orderStatusColor(order.orderStatus)}22`,
                            color: orderStatusColor(order.orderStatus),
                            fontWeight: 700,
                            textTransform: 'capitalize'
                          }}
                        >
                          {humanStatus(order.orderStatus)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.1rem' }}>
                        {order.shopName}{order.shopCity ? `, ${order.shopCity}` : ''} &bull;{' '}
                        {order.fulfillmentMethod === 'home_delivery' ? '🚚 Home Delivery' : '🏪 Shop Pickup'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', marginBottom: '0.4rem' }}>
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <Link
                        to={`/my-orders/${order.id}`}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No Orders Yet</p>
                  <p style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Browse the spare parts marketplace to place your first order.
                  </p>
                  <Link to="/spare-parts" className="btn btn-sm btn-primary">
                    <Package size={14} /> Browse Parts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Vehicle + Hotline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Active Vehicle Card */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem' }}>Active Vehicle</h3>
              </div>
              <Link to="/vehicles" style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)' }}>
                Manage
              </Link>
            </div>
            <div className="card-body">
              {selectedVehicle ? (
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {selectedVehicle.make} {selectedVehicle.model}
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-block',
                      marginBottom: '1rem',
                      letterSpacing: '0.05em',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {selectedVehicle.registrationNumber}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Year: </span>
                      <strong>{selectedVehicle.year || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Fuel: </span>
                      <strong>{selectedVehicle.fuelType || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Type: </span>
                      <strong>{selectedVehicle.type || '—'}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    No vehicle enrolled yet.
                  </p>
                  <Link to="/vehicles" className="btn btn-primary btn-sm">
                    <Plus size={16} /> Add Vehicle
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem' }}>Quick Links</h3>
            </div>
            <div className="card-body" style={{ padding: '0.5rem 0' }}>
              {[
                { to: '/my-orders', label: 'My Orders', icon: ShoppingBag, color: '#3B82F6' },
                { to: '/vehicles', label: 'My Garage', icon: Car, color: '#8B5CF6' },
                { to: '/spare-parts', label: 'Spare Parts', icon: Package, color: '#10B981' },
                { to: '/mechanics', label: 'Find Mechanic', icon: Wrench, color: '#60A5FA' }
              ].map(({ to, label, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'background 0.15s',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#1C2028')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={16} color={color} />
                  <span>{label}</span>
                  <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* 24/7 Hotline Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #1C2028 0%, #20191B 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-primary)'
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>24/7 Road Helpline</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Toll-free emergency dispatch</p>
                </div>
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}
              >
                1800-ROAD-911
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Direct satellite link for remote highway dead zones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe styles for Loader spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </DashboardLayout>
  );
};

export default DashboardPage;
