import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Navigation,
  Phone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Wrench,
  Radio,
  Car,
  MapPin,
  RefreshCw,
  XCircle,
  Search
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import authApi from '../utils/api';
import useLiveTracking from '../hooks/useLiveTracking';
import LiveTrackingMap from '../components/maps/LiveTrackingMap';
import ErrorBoundary from '../components/common/ErrorBoundary';

export const TrackingPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Real-time tracking hook
  const {
    mechanicLocation,
    requestStatus,
    lastUpdated,
    error: socketError,
    connected
  } = useLiveTracking(requestId);

  // Fetch initial request details
  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await authApi.getRequestById(requestId);
      if (res.success && res.request) {
        setRequest(res.request);
      }
    } catch (err) {
      setLoadError(err.message || 'Unable to load service request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  // Sync status if real-time update arrives
  useEffect(() => {
    if (requestStatus && request && request.status !== requestStatus) {
      setRequest((prev) => ({
        ...prev,
        status: requestStatus
      }));
    }
  }, [requestStatus]);

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel this emergency roadside assistance request?')) {
      return;
    }
    try {
      setCancelling(true);
      await authApi.updateRequestStatus(request._id || request.id, 'cancelled', 'Cancelled by customer');
      await fetchRequestDetails();
    } catch (err) {
      alert(`Could not cancel request: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Live Tracking">
        <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
          <RefreshCw size={36} className="spin-animation" style={{ color: '#eab308', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', color: '#f8fafc', marginBottom: '8px' }}>Connecting to Live Rescue Radar...</h2>
          <p style={{ color: '#94a3b8' }}>Establishing telemetry channel for Ticket #{requestId}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError || !request) {
    return (
      <DashboardLayout title="Live Tracking">
        <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '22px', color: '#f8fafc', marginBottom: '8px' }}>Request Not Found</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{loadError || 'The requested assistance ticket could not be found.'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const currentStatus = requestStatus || request.status;
  const isCancelled = currentStatus === 'cancelled';
  const isCompleted = currentStatus === 'completed';
  const isRejected = currentStatus === 'rejected';

  const stages = [
    { key: 'submitted', label: 'Dispatched', desc: 'Request broadcast to network' },
    { key: 'accepted', label: 'Accepted', desc: 'Mechanic confirmed dispatch' },
    { key: 'on_the_way', label: 'En Route', desc: 'Mechanic driving to you' },
    { key: 'arrived', label: 'Arrived', desc: 'Mechanic on site' },
    { key: 'repair_in_progress', label: 'In Repair', desc: 'Vehicle being serviced' },
    { key: 'completed', label: 'Resolved', desc: 'Job successfully finished' }
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === currentStatus);

  return (
    <DashboardLayout title={`Tracking #${request.requestId}`}>
      <div className="tracking-page-container" style={{ padding: '16px 0 48px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Navigation & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                background: isRejected
                  ? 'rgba(239, 68, 68, 0.15)'
                  : connected
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(234, 179, 8, 0.15)',
                color: isRejected ? '#ef4444' : connected ? '#10b981' : '#eab308',
                border: `1px solid ${
                  isRejected
                    ? 'rgba(239, 68, 68, 0.3)'
                    : connected
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(234, 179, 8, 0.3)'
                }`
              }}
            >
              <Radio size={14} className={connected && !isRejected ? 'pulse-icon' : ''} />
              {isRejected ? 'REQUEST DECLINED' : connected ? 'LIVE TELEMETRY' : 'CONNECTING'}
            </span>

            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Ticket #{request.requestId}</span>
          </div>
        </div>

        {/* If Rejected: Show dedicated graceful re-selection view */}
        {isRejected ? (
          <div
            style={{
              background: 'var(--card-bg, #1e293b)',
              borderRadius: '16px',
              padding: '36px 24px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              textAlign: 'center',
              maxWidth: '680px',
              margin: '2rem auto'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <XCircle size={36} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Service Request Declined
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
              The selected technician was unavailable or could not dispatch to your location at this time.
              You can immediately select another certified specialist from the RoadRescue network.
            </p>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                border: '1px solid var(--border-color, #334155)',
                display: 'inline-block',
                textAlign: 'left',
                minWidth: '320px'
              }}
            >
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Ticket Details:</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {request.vehicleName} • {request.problemCategory}
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                <MapPin size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                {request.location}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/mechanics"
                state={{
                  coordinates: request.customerCoordinates,
                  location: request.location,
                  problemCategory: request.problemCategory,
                  vehicleName: request.vehicleName,
                  vehicleReg: request.vehicleReg
                }}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '15px' }}
              >
                <Search size={16} /> Find Another Mechanic
              </Link>

              <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '15px' }}>
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Status Pipeline */}
            <div
              style={{
                background: 'var(--card-bg, #1e293b)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid var(--border-color, #334155)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                    Assistance Status: <span style={{ color: '#eab308' }}>{currentStatus.replace(/_/g, ' ').toUpperCase()}</span>
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                    Vehicle: {request.vehicleName} {request.vehicleReg ? `(${request.vehicleReg})` : ''} • Issue: {request.problemCategory}
                  </p>
                </div>

                {currentStatus === 'submitted' && (
                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelling}
                    className="btn btn-outline"
                    style={{ color: '#ef4444', borderColor: '#ef4444', padding: '6px 14px', fontSize: '13px' }}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                )}
              </div>

              {/* Stepper Progress */}
              {!isCancelled ? (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 1fr)`, gap: '8px', position: 'relative' }}>
                  {stages.map((stage, idx) => {
                    const isPassed = idx <= currentStageIndex;
                    const isCurrent = idx === currentStageIndex;
                    return (
                      <div key={stage.key} style={{ textAlign: 'center' }}>
                        <div
                          style={{
                            height: '6px',
                            borderRadius: '3px',
                            background: isPassed ? '#eab308' : '#334155',
                            marginBottom: '10px',
                            transition: 'background 0.3s ease'
                          }}
                        />
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? '#eab308' : isPassed ? '#f8fafc' : '#64748b'
                          }}
                        >
                          {stage.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> This emergency service request was cancelled.
                </div>
              )}
            </div>

            {/* Live Map & Mechanic Card Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
              {/* Map Column */}
              <div>
                <ErrorBoundary
                  title="Tracking Radar Display"
                  message="Map radar could not render. Telemetry updates remain active in the summary panel."
                >
                  <LiveTrackingMap
                    customerLocation={request.customerCoordinates}
                    mechanicLocation={mechanicLocation || request.mechanicLastLocation}
                    status={currentStatus}
                  />
                </ErrorBoundary>

                {mechanicLocation && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                    <span>GPS Accuracy: ±{Math.round(mechanicLocation.accuracy || 10)}m</span>
                    <span>
                      Last Telemetry Ping: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                )}
              </div>

              {/* Mechanic & Request Info Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Mechanic Profile */}
                <div
                  style={{
                    background: 'var(--card-bg, #1e293b)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid var(--border-color, #334155)'
                  }}
                >
                  <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wrench size={18} style={{ color: '#eab308' }} /> Assigned Technician
                  </h3>

                  {request.mechanicName ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: '#eab308',
                            color: '#0f172a',
                            fontWeight: 700,
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {request.mechanicName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '16px', color: '#f8fafc' }}>{request.mechanicName}</div>
                          <div style={{ fontSize: '13px', color: '#94a3b8' }}>{request.workshopName || 'Certified Partner'}</div>
                        </div>
                      </div>

                      {request.mechanicId?.phone && (
                        <a
                          href={`tel:${request.mechanicId.phone}`}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            fontSize: '14px'
                          }}
                        >
                          <Phone size={16} /> Call Technician ({request.mechanicId.phone})
                        </a>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                      <RefreshCw size={24} className="spin-animation" style={{ color: '#eab308', margin: '0 auto 8px' }} />
                      Waiting for nearest mechanic to accept dispatch...
                    </div>
                  )}
                </div>

                {/* Breakdown Location & Estimated Fee */}
                <div
                  style={{
                    background: 'var(--card-bg, #1e293b)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid var(--border-color, #334155)'
                  }}
                >
                  <h3 style={{ margin: '0 0 14px', fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={17} style={{ color: '#3b82f6' }} /> Service Location
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {request.location}
                  </p>

                  <div style={{ borderTop: '1px solid #334155', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {isCompleted ? 'Final Service Charge:' : 'Estimated Base Charge:'}
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#eab308' }}>
                      ₹{request.finalCharge || request.estimatedCharge || 250}
                    </span>
                  </div>
                </div>

                {/* Emergency Hotline Contact */}
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <ShieldAlert size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>RoadRescue SOS Hotline</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>24/7 Police & Ambulance Dispatch</div>
                    <a href="tel:112" style={{ color: '#ef4444', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginTop: '2px' }}>
                      Emergency Call 112
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TrackingPage;
