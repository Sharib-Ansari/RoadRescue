import React, { useState, useEffect } from 'react';
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
  Plus,
  Navigation,
  RotateCcw,
  XCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useVehicles } from '../context/VehicleContext';
import StatusBadge from '../components/common/StatusBadge';
import { formatDate, formatCurrency } from '../utils/helpers';
import authApi from '../utils/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const { vehicles, selectedVehicle } = useVehicles();

  const [serviceRequests, setServiceRequests] = useState([]);
  const [activeOngoingRequest, setActiveOngoingRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await authApi.getMyRequests();
        if (response?.success && Array.isArray(response.requests) && response.requests.length > 0) {
          const mapped = response.requests.map((r) => ({
            id: r.requestId || r.id || r._id,
            rawStatus: r.status,
            serviceType: r.problemCategory,
            mechanicName: r.mechanicName || (r.mechanicId?.name) || 'Assigned Mechanic',
            workshopName: r.workshopName || (r.mechanicId?.mechanicProfile?.workshopName) || 'RoadRescue Partner',
            vehicleName: r.vehicleName,
            vehicleReg: r.vehicleReg,
            location: r.location,
            customerCoordinates: r.customerCoordinates,
            date: r.createdAt,
            charge: r.finalCharge || r.estimatedCharge || 250,
            status: r.status === 'on_the_way' ? 'On The Way' : (r.status === 'repair_in_progress' ? 'Repair In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1))
          }));
          setServiceRequests(mapped);
        }
      } catch (err) {
        console.warn('Could not fetch requests from server, using local history:', err.message);
      }
    };

    const fetchActiveRequest = async () => {
      try {
        const res = await authApi.getActiveRequest();
        if (res?.success && res.hasActiveRequest && res.request) {
          // Double guard against rejected requests
          if (res.request.status !== 'rejected') {
            setActiveOngoingRequest(res.request);
          } else {
            setActiveOngoingRequest(null);
          }
        }
      } catch (err) {
        // quiet ignore
      }
    };

    fetchRequests();
    fetchActiveRequest();

    if (window.location.hash === '#history') {
      setTimeout(() => {
        const el = document.getElementById('service-history-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  return (
    <DashboardLayout title="Dashboard">
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
            <ShieldCheck size={14} /> Active Roadside Protection
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            Hello, {user?.name || 'Driver'}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Your roadside emergency network is active and ready 24/7.
          </p>
        </div>

        <Link
          to="/emergency"
          className="btn btn-danger btn-lg"
          style={{ boxShadow: 'var(--shadow-glow)' }}
        >
          <AlertTriangle size={20} />
          Emergency SOS
        </Link>
      </div>

      {/* Active Ongoing Roadside Request Alert */}
      {activeOngoingRequest && (
        <div
          style={{
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Active Breakdown Ticket #{activeOngoingRequest.requestId} ({activeOngoingRequest.status.replace(/_/g, ' ').toUpperCase()})
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#cbd5e1' }}>
                {activeOngoingRequest.vehicleName} • {activeOngoingRequest.problemCategory} • {activeOngoingRequest.location}
              </p>
            </div>
          </div>
          {['accepted', 'on_the_way', 'arrived', 'repair_in_progress'].includes(activeOngoingRequest.status) ? (
            <Link
              to={`/tracking/${activeOngoingRequest.requestId}`}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              Open Live GPS Tracking Map <ArrowRight size={16} />
            </Link>
          ) : activeOngoingRequest.status === 'submitted' ? (
            <Link
              to={`/tracking/${activeOngoingRequest.requestId}`}
              className="btn btn-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              View Dispatch Radar <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      )}

      {/* Declined / Rejected Recent Request Banner if any */}
      {!activeOngoingRequest && serviceRequests.length > 0 && serviceRequests[0].rawStatus === 'rejected' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                Request #{serviceRequests[0].id} Declined by Technician
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#fca5a5' }}>
                The selected mechanic was unable to assist with {serviceRequests[0].serviceType}. Please select another nearby specialist.
              </p>
            </div>
          </div>
          <Link
            to="/mechanics"
            state={{
              coordinates: serviceRequests[0].customerCoordinates,
              location: serviceRequests[0].location,
              problemCategory: serviceRequests[0].serviceType,
              vehicleName: serviceRequests[0].vehicleName,
              vehicleReg: serviceRequests[0].vehicleReg
            }}
            className="btn btn-danger"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={16} /> Find Another Mechanic
          </Link>
        </div>
      )}

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
          <div className="card" id="service-history-section">
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
              {serviceRequests.length > 0 ? (
                serviceRequests.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: idx !== serviceRequests.length - 1 ? '1px solid var(--border-color)' : 'none',
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

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(item.charge)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.id}
                      </div>

                      {/* Status Action Buttons */}
                      <div style={{ marginTop: '0.2rem' }}>
                        {['accepted', 'on_the_way', 'arrived', 'repair_in_progress'].includes(item.rawStatus) && (
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
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
                  <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    No Service Requests Yet
                  </p>
                  <p style={{ fontSize: '0.8125rem', marginBottom: '1rem' }}>
                    When you request emergency roadside assistance, your request timeline and tracking will appear here.
                  </p>
                  <Link to="/emergency" className="btn btn-sm btn-primary">
                    Request Assistance
                  </Link>
                </div>
              )}
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
