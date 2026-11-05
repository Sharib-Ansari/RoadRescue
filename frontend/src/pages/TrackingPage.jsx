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
  Search,
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import authApi from '../utils/api';
import useLiveTracking from '../hooks/useLiveTracking';
import LiveTrackingMap from '../components/maps/LiveTrackingMap';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { formatCurrency, formatDate } from '../utils/helpers';

export const TrackingPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Real-time tracking hook
  const {
    mechanicLocation: socketMechanicLoc,
    requestStatus,
    lastUpdated,
    error: socketError,
    connected
  } = useLiveTracking(requestId);

  // Fetch initial request details directly from MongoDB Atlas
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

  // Sync status if real-time update arrives via Socket.IO
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

  // 1. Resolve authentic Customer Breakdown Coordinates from MongoDB
  const customerLocation = (request.customerCoordinates &&
    typeof request.customerCoordinates.latitude === 'number' &&
    typeof request.customerCoordinates.longitude === 'number')
    ? {
        latitude: request.customerCoordinates.latitude,
        longitude: request.customerCoordinates.longitude
      }
    : null;

  // 2. Resolve authentic Assigned Mechanic Coordinates
  // Priority: Socket.IO live broadcast -> Request saved last location -> Mechanic MongoDB profile location [lng, lat]
  let activeMechanicLoc = socketMechanicLoc || request.mechanicLastLocation;
  if (!activeMechanicLoc && request.mechanicId?.mechanicProfile?.location?.coordinates?.length === 2) {
    const coords = request.mechanicId.mechanicProfile.location.coordinates;
    activeMechanicLoc = {
      latitude: coords[1], // GeoJSON index 1 is latitude
      longitude: coords[0], // GeoJSON index 0 is longitude
      updatedAt: request.mechanicId.mechanicProfile.locationUpdatedAt || request.updatedAt
    };
  }

  const stages = [
    { key: 'submitted', label: 'Dispatched', desc: 'Request broadcast to network' },
    { key: 'accepted', label: 'Accepted', desc: 'Mechanic confirmed dispatch' },
    { key: 'on_the_way', label: 'En Route', desc: 'Mechanic driving to you' },
    { key: 'arrived', label: 'Arrived', desc: 'Mechanic on site' },
    { key: 'repair_in_progress', label: 'In Repair', desc: 'Vehicle being serviced' },
    { key: 'completed', label: 'Resolved', desc: 'Job successfully finished' }
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === currentStatus);

  // Extract completion timestamp from status history if recorded
  const completionHistoryEntry = Array.isArray(request.statusHistory)
    ? request.statusHistory.slice().reverse().find((h) => h.status === 'completed')
    : null;
  const completionTimestamp = completionHistoryEntry?.timestamp || request.updatedAt || request.createdAt;

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
                background: isCompleted
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isRejected
                  ? 'rgba(239, 68, 68, 0.15)'
                  : connected
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(234, 179, 8, 0.15)',
                color: isCompleted ? '#10b981' : isRejected ? '#ef4444' : connected ? '#10b981' : '#eab308',
                border: `1px solid ${
                  isCompleted
                    ? 'rgba(16, 185, 129, 0.3)'
                    : isRejected
                    ? 'rgba(239, 68, 68, 0.3)'
                    : connected
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(234, 179, 8, 0.3)'
                }`
              }}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={14} /> SERVICE RESOLVED
                </>
              ) : isRejected ? (
                <>
                  <XCircle size={14} /> REQUEST DECLINED
                </>
              ) : (
                <>
                  <Radio size={14} className={connected ? 'pulse-icon' : ''} />
                  {connected ? 'LIVE TELEMETRY' : 'CONNECTING'}
                </>
              )}
            </span>

            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Ticket #{request.requestId}</span>
          </div>
        </div>

        {/* =========================================================================
            STATE 1: SERVICE COMPLETED SCREEN (Dedicated Premium Experience)
            ========================================================================= */}
        {isCompleted ? (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            {/* Main Completion Hero Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #131b26 0%, #0d121b 100%)',
                borderRadius: '24px',
                padding: '48px 32px',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)',
                textAlign: 'center',
                marginBottom: '28px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top ambient glow */}
              <div
                style={{
                  position: 'absolute',
                  top: '-80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '260px',
                  height: '260px',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}
              />

              {/* Animated Success Checkmark Icon */}
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid rgba(16, 185, 129, 0.5)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 0 35px rgba(16, 185, 129, 0.4)'
                }}
              >
                <CheckCircle2 size={46} strokeWidth={2.5} />
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  marginBottom: '12px',
                  letterSpacing: '-0.5px'
                }}
              >
                You're Back on the Road!
              </h1>

              {/* Supporting Message */}
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  color: '#cbd5e1',
                  maxWidth: '560px',
                  margin: '0 auto 32px'
                }}
              >
                Your vehicle assistance has been successfully completed. Thank you for trusting RoadRescue.
                We hope the rest of your journey is safe and smooth!
              </p>

              {/* Primary & Secondary Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: 700
                  }}
                >
                  Back to Dashboard <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/dashboard#history')}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: 600
                  }}
                >
                  <Clock size={16} /> View Service History
                </button>
              </div>
            </div>

            {/* Service Summary Card */}
            <div
              style={{
                background: 'var(--card-bg, #1e293b)',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid var(--border-color, #334155)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
            >
              <h3
                style={{
                  margin: '0 0 20px',
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <ShieldAlert size={18} style={{ color: '#10b981' }} /> Official Service Summary
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                {/* Request Ticket ID */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ticket Number</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>#{request.requestId}</span>
                </div>

                {/* Vehicle Model & Registration */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Assisted Vehicle</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {request.vehicleName} {request.vehicleReg ? `(${request.vehicleReg})` : ''}
                  </span>
                </div>

                {/* Problem Category */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Reported Problem</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#eab308' }}>{request.problemCategory}</span>
                </div>

                {/* Assigned Specialist */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Assigned Specialist</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                    {request.mechanicName || request.mechanicId?.name || 'RoadRescue Partner'}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {request.workshopName || request.mechanicId?.mechanicProfile?.workshopName || 'Certified Workshop'}
                  </span>
                </div>

                {/* Breakdown Destination */}
                <div style={{ gridColumn: 'span 2', background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Service Location</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '14px' }}>
                    <MapPin size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span>{request.location}</span>
                  </div>
                </div>

                {/* Completion Date & Time */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Resolved Date & Time</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                    <Calendar size={14} style={{ color: '#10b981' }} />
                    <span>{formatDate(completionTimestamp)}</span>
                  </div>
                </div>

                {/* Final Service Charge */}
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px 16px', borderRadius: '12px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Final Service Charge</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                    {formatCurrency(request.finalCharge || request.estimatedCharge || 250)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : isRejected ? (
          /* =========================================================================
             STATE 2: DECLINED / REJECTED REQUEST SCREEN
             ========================================================================= */
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
                  coordinates: customerLocation,
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
          /* =========================================================================
             STATE 3: ACTIVE LIVE TELEMETRY RADAR SCREEN
             ========================================================================= */
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
                    customerLocation={customerLocation}
                    mechanicLocation={activeMechanicLoc}
                    status={currentStatus}
                    locationAddress={request.location}
                    mechanicName={request.mechanicName || request.mechanicId?.name || 'Assigned Mechanic'}
                    workshopName={request.workshopName || request.mechanicId?.mechanicProfile?.workshopName || 'RoadRescue Partner'}
                    connected={connected}
                  />
                </ErrorBoundary>

                {activeMechanicLoc && (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                    <span>GPS Accuracy: ±{Math.round(activeMechanicLoc.accuracy || 10)}m</span>
                    <span>
                      Last Telemetry Ping: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : (activeMechanicLoc.updatedAt ? new Date(activeMechanicLoc.updatedAt).toLocaleTimeString() : 'Just now')}
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
                            background: '#ef4444',
                            color: '#ffffff',
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
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Estimated Base Charge:</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#eab308' }}>
                      ₹{request.estimatedCharge || 250}
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
