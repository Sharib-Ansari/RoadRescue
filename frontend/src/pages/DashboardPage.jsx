import React from 'react';
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
  Calendar,
  Plus
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import { mockServiceHistory } from '../data/mockRequests';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../utils/helpers';

const DashboardPage = () => {
  const { user } = useAuth();
  const { vehicles, selectedVehicle } = useVehicles();
  const isMechanic = user?.accountType === 'mechanic' || user?.role === 'mechanic';

  return (
    <DashboardLayout title={isMechanic ? 'Mechanic Partner Dashboard' : 'Dashboard'}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2028 0%, #161A22 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> {isMechanic ? '🔧 Certified Mechanic Partner' : 'Active Roadside Protection'}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Hello, {user?.name || (isMechanic ? 'Partner' : 'Driver')}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            {isMechanic
              ? 'Your mobile workshop is live on the RoadRescue dispatch grid.'
              : 'Your roadside emergency network is active and ready 24/7.'}
          </p>
        </div>

        <Link
          to={isMechanic ? "/mechanics" : "/emergency"}
          className={`btn ${isMechanic ? 'btn-primary' : 'btn-danger'} btn-lg`}
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          {isMechanic ? <Wrench size={20} /> : <AlertTriangle size={20} />}
          {isMechanic ? 'Nearby Service Requests' : 'Emergency SOS'}
        </Link>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-4 gap-4" style={{ marginBottom: '2rem' }}>
        <Link to="/emergency" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-primary)' }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Emergency Assist</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            One-click instant GPS roadside dispatch
          </p>
        </Link>

        <Link to="/mechanics" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-secondary)' }}>
              <Wrench size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Find Mechanic</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Browse 12+ rated nearby workshops
          </p>
        </Link>

        <Link to="/spare-parts" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)' }}>
              <Package size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Spare Parts</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Genuine batteries, tyres, and engine spares
          </p>
        </Link>

        <Link to="/vehicles" className="card card-hover" style={{ padding: '1.25rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
              <Car size={22} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Garage</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} enrolled
          </p>
        </Link>
      </div>

      {/* Main 2-Column Split: Active Vehicle & Service History */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Service History */}
        <div style={{ gridColumn: 'span 2' }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--accent-secondary)" />
                <h3 style={{ fontSize: '1.1rem' }}>Recent Assistance Requests</h3>
              </div>
              <Link to="/mechanics" style={{ fontSize: '0.8125rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                New Request <ArrowRight size={14} />
              </Link>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {mockServiceHistory.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: idx !== mockServiceHistory.length - 1 ? '1px solid var(--border-color)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.serviceType}</span>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      Mechanic: <strong>{item.mechanicName}</strong> ({item.workshopName})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {item.vehicleName} • {formatDate(item.date)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.charge)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Vehicle Widget & Support Contact */}
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
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
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
                      <span style={{ color: 'var(--text-muted)' }}>Year:</span>{' '}
                      <strong>{selectedVehicle.year}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Fuel:</span>{' '}
                      <strong>{selectedVehicle.fuelType}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Type:</span>{' '}
                      <strong>{selectedVehicle.type}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Color:</span>{' '}
                      <strong>{selectedVehicle.color}</strong>
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
    </DashboardLayout>
  );
};

export default DashboardPage;
