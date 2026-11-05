import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  DollarSign,
  TrendingUp,
  MapPin,
  Car,
  Bike,
  Truck,
  Phone,
  Navigation,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Radio,
  Calendar,
  Sparkles
} from 'lucide-react';
import MechanicDashboardLayout from '../layouts/MechanicDashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useMechanicLocation from '../hooks/useMechanicLocation';
import { storage } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/helpers';
import authApi from '../utils/api';
import './MechanicDashboardPage.css';

const JOB_STATUSES = [
  'Accepted',
  'On The Way',
  'Arrived',
  'Repair In Progress',
  'Completed'
];

export default function MechanicDashboardPage() {
  const { user } = useAuth();

  // Availability state
  const [isOnline, setIsOnline] = useState(() => {
    if (user?.mechanicProfile?.isAvailable !== undefined) {
      return user.mechanicProfile.isAvailable;
    }
    return true;
  });

  // Real requests from MongoDB Atlas
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);

  // Real statistics from MongoDB Atlas
  const [dbStats, setDbStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    acceptedJobs: 0,
    completedJobs: 0,
    totalEarnings: 0
  });

  // Action feedback banner
  const [actionAlert, setActionAlert] = useState(null);

  // Fetch real requests and live statistics from MongoDB Atlas
  const fetchMechanicData = async () => {
    try {
      // 1. Fetch real requests from MongoDB
      const res = await authApi.getMyRequests();
      if (res?.success && Array.isArray(res.requests)) {
        const dbIncoming = [];
        const dbActive = [];
        const dbCompleted = [];

        res.requests.forEach((r) => {
          const formatted = {
            id: r.requestId || r.id || r._id,
            dbId: r.id || r._id,
            customerName: r.customerId?.name || 'Stranded Driver',
            customerPhone: r.customerId?.phone || '+91 98765 00000',
            vehicleType: r.vehicleName?.toLowerCase().includes('bike') ? 'Motorcycle/Bike' : 'Car',
            vehicleModel: `${r.vehicleName} ${r.vehicleReg ? `(${r.vehicleReg})` : ''}`,
            problemCategory: r.problemCategory,
            description: r.description || 'Assistance requested',
            location: r.location,
            customerCoordinates: r.customerCoordinates,
            estimatedCharge: r.estimatedCharge || 250,
            requestedAt: new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: r.status === 'on_the_way' ? 'On The Way' : (r.status === 'repair_in_progress' ? 'Repair In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1)),
            rawStatus: r.status,
            isDbRecord: true
          };

          if (r.status === 'submitted') {
            dbIncoming.push(formatted);
          } else if (['accepted', 'on_the_way', 'arrived', 'repair_in_progress'].includes(r.status)) {
            dbActive.push(formatted);
          } else if (r.status === 'completed') {
            dbCompleted.push({
              ...formatted,
              servicePerformed: `${r.problemCategory} Resolution`,
              amountEarned: r.finalCharge || r.estimatedCharge || 250,
              completedAt: new Date(r.updatedAt || r.createdAt).toLocaleDateString(),
              status: 'Completed',
              rating: 5.0
            });
          }
        });

        setIncomingRequests(dbIncoming);
        setActiveJobs(dbActive);
        setCompletedJobs(dbCompleted);
      }

      // 2. Fetch real aggregated stats from MongoDB Atlas
      const statsRes = await authApi.getMechanicDashboardStats();
      if (statsRes?.success && statsRes.stats) {
        setDbStats(statsRes.stats);
      }
    } catch (err) {
      console.warn('Could not fetch data from backend API:', err.message);
    }
  };

  const { socket, connected: socketConnected } = useSocket();

  // Find active job if any
  const activeDbJob = activeJobs.find(
    (j) => j.isDbRecord || (!j.id.startsWith('JOB-') && !j.id.startsWith('REQ-'))
  );
  const activeRequestId = activeDbJob ? (activeDbJob.dbId || activeDbJob.id) : null;

  // Real-time GPS broadcasting hook
  const {
    isBroadcasting,
    currentLocation,
    broadcastError,
    startBroadcasting,
    stopBroadcasting
  } = useMechanicLocation(activeRequestId);

  // Listen for real-time incoming requests dispatched across network
  useEffect(() => {
    if (!socket || !socketConnected) return;

    const handleNewRequest = (data) => {
      fetchMechanicData();
      setActionAlert({
        type: 'info',
        message: `🚨 NEW SOS DISPATCH: ${data.vehicleName} reported ${data.problemCategory} near ${data.location}!`
      });
    };

    const handleStatusChanged = () => {
      fetchMechanicData();
    };

    socket.on('request:available', handleNewRequest);
    socket.on('request:status_updated', handleStatusChanged);

    return () => {
      socket.off('request:available', handleNewRequest);
      socket.off('request:status_updated', handleStatusChanged);
    };
  }, [socket, socketConnected]);

  useEffect(() => {
    fetchMechanicData();
  }, []);

  const toggleAvailability = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    try {
      await authApi.updateAvailability(nextState);
    } catch (err) {
      console.warn('Failed to update availability in backend:', err.message);
    }

    setActionAlert({
      type: nextState ? 'success' : 'info',
      message: nextState
        ? 'You are now ONLINE and visible to nearby stranded drivers on the dispatch grid.'
        : 'You are now OFFLINE. Incoming emergency dispatch requests are paused.'
    });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Accept incoming request
  const handleAcceptRequest = async (request) => {
    const targetId = request.dbId || request.id;
    try {
      await authApi.updateRequestStatus(targetId, 'accepted', 'Mechanic accepted the request');
    } catch (err) {
      console.warn('API error accepting request:', err.message);
      alert(`Could not accept request: ${err.message}`);
      return;
    }

    setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id && r.dbId !== targetId));
    await fetchMechanicData();

    setActionAlert({
      type: 'success',
      message: `Accepted request from ${request.customerName}. Job added to Active Jobs!`
    });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Reject incoming request
  const handleRejectRequest = async (requestOrId) => {
    const targetId = typeof requestOrId === 'string' ? requestOrId : (requestOrId.dbId || requestOrId.id);
    try {
      await authApi.updateRequestStatus(targetId, 'rejected', 'Declined by technician');
    } catch (err) {
      console.warn('API error declining request:', err.message);
    }

    setIncomingRequests((prev) => prev.filter((r) => r.id !== targetId && r.dbId !== targetId));
    await fetchMechanicData();

    setActionAlert({
      type: 'info',
      message: 'Request declined. The customer has been notified and can select another specialist.'
    });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // Advance or set job status
  const handleUpdateJobStatus = async (jobId, newStatus) => {
    const job = activeJobs.find((j) => j.id === jobId || j.dbId === jobId);
    if (!job) return;

    const targetId = job.dbId || job.id;
    try {
      const backendStatus = newStatus.toLowerCase().replace(/\s+/g, '_');
      await authApi.updateRequestStatus(targetId, backendStatus, `Milestone updated to ${newStatus}`);
    } catch (err) {
      console.warn('API error updating status:', err.message);
      alert(`Could not update status: ${err.message}`);
      return;
    }

    await fetchMechanicData();

    if (newStatus === 'Completed') {
      if (isBroadcasting) {
        stopBroadcasting();
      }
      setActionAlert({
        type: 'success',
        message: `Job completed! Service charge added to your earnings balance.`
      });
      setTimeout(() => setActionAlert(null), 5000);
    } else {
      setActionAlert({
        type: 'info',
        message: `Job status updated to: ${newStatus}`
      });
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  // Accurate statistics from MongoDB database
  const totalEarnings = dbStats.totalEarnings !== undefined
    ? dbStats.totalEarnings
    : completedJobs.reduce((acc, job) => acc + (Number(job.amountEarned) || 0), 0);
  const totalRequestsCount = dbStats.totalRequests !== undefined
    ? dbStats.totalRequests
    : (incomingRequests.length + activeJobs.length + completedJobs.length);

  const getVehicleIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('bike') || t.includes('motorcycle')) return <Bike size={18} />;
    if (t.includes('truck')) return <Truck size={18} />;
    return <Car size={18} />;
  };

  return (
    <MechanicDashboardLayout isOnline={isOnline} onToggleOnline={toggleAvailability}>
      <div className="mechanic-dashboard-container">
        {/* Flash Alert Banner */}
        {actionAlert && (
          <div className={`mech-flash-alert ${actionAlert.type}`}>
            <Sparkles size={18} />
            <span>{actionAlert.message}</span>
            <button
              type="button"
              className="alert-dismiss-btn"
              onClick={() => setActionAlert(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* =========================================================
            A. WELCOME SECTION & AVAILABILITY STATUS
           ========================================================= */}
        <div className="mech-welcome-banner">
          <div className="mech-welcome-info">
            <div className="mech-verified-tag">
              <ShieldCheck size={14} /> CERTIFIED SERVICE PARTNER
            </div>
            <h1 className="mech-welcome-title">
              Welcome back, {user?.name || 'Partner'}! 🔧
            </h1>
            <p className="mech-welcome-desc">
              {user?.workshopName ? <strong>{user.workshopName} • </strong> : null}
              {isOnline
                ? 'Your mobile garage is online. Live GPS radar is actively receiving stranded vehicle dispatches.'
                : 'You are currently offline. Toggle your status to receive instant roadside requests.'}
            </p>
          </div>

          <div className="mech-availability-card">
            <div className="availability-card-header">
              <span className="availability-label">DISPATCH STATUS</span>
              <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
                <span className={`status-indicator-dot ${isOnline ? 'online' : 'offline'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="availability-desc">
              {isOnline
                ? 'Accepting incoming emergency breakdown requests'
                : 'Offline: Not accepting new dispatches'}
            </p>
            <button
              type="button"
              onClick={toggleAvailability}
              className={`btn-toggle-availability ${isOnline ? 'btn-go-offline' : 'btn-go-online'}`}
            >
              <Radio size={16} />
              {isOnline ? 'Switch to Offline' : 'Go Online Now'}
            </button>
          </div>
        </div>

        {/* Real-time GPS Telemetry Broadcaster Card */}
        <div style={{
          background: 'var(--card-bg, #1e293b)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid var(--border-color, #334155)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isBroadcasting ? '#10b981' : '#64748b'
              }} />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontWeight: 600 }}>
                Live GPS Location Radar: {isBroadcasting ? 'Broadcasting Active' : 'Idle'}
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
              {isBroadcasting
                ? `Transmitting high-precision coordinates to active customer • Accuracy: ±${Math.round(currentLocation?.accuracy || 10)}m`
                : 'Share your vehicle GPS location in real-time with customers when en route.'}
            </p>
            {currentLocation && isBroadcasting && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                Lat: {currentLocation.latitude.toFixed(5)}° N, Lng: {currentLocation.longitude.toFixed(5)}° E
              </div>
            )}
            {broadcastError && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444' }}>
                {broadcastError}
              </div>
            )}
          </div>

          <div>
            {isBroadcasting ? (
              <button
                type="button"
                onClick={stopBroadcasting}
                className="btn btn-outline"
                style={{ color: '#ef4444', borderColor: '#ef4444', fontSize: '13px', padding: '8px 16px' }}
              >
                Stop GPS Broadcast
              </button>
            ) : (
              <button
                type="button"
                onClick={startBroadcasting}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 16px' }}
              >
                <Navigation size={15} /> Start Live GPS Sharing
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            C. DASHBOARD STATISTICS
           ========================================================= */}
        <div className="mech-stats-grid">
          <div className="mech-stat-card">
            <div className="stat-icon-wrapper blue">
              <Wrench size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Requests</span>
              <span className="stat-value">{totalRequestsCount}</span>
              <span className="stat-meta">Lifetime across platform</span>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="stat-icon-wrapper amber">
              <Clock size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Pending Requests</span>
              <span className="stat-value">{incomingRequests.length}</span>
              <span className="stat-meta">Require your action</span>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="stat-icon-wrapper purple">
              <PlayCircle size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Accepted Jobs</span>
              <span className="stat-value">{activeJobs.length}</span>
              <span className="stat-meta">In progress right now</span>
            </div>
          </div>

          <div className="mech-stat-card">
            <div className="stat-icon-wrapper green">
              <CheckCircle2 size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Completed Jobs</span>
              <span className="stat-value">{dbStats.completedJobs !== undefined ? dbStats.completedJobs : completedJobs.length}</span>
              <span className="stat-meta">100% resolution rate</span>
            </div>
          </div>

          <div className="mech-stat-card earnings-card" id="earnings">
            <div className="stat-icon-wrapper emerald">
              <DollarSign size={22} />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Earnings</span>
              <span className="stat-value earnings-val">{formatCurrency(totalEarnings)}</span>
              <span className="stat-meta positive">
                <TrendingUp size={13} /> Verified direct earnings
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================
            D. INCOMING SERVICE REQUESTS
           ========================================================= */}
        <section className="mech-section" id="requests">
          <div className="mech-section-header">
            <div className="section-title-wrap">
              <div className="section-icon-badge amber">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="mech-section-title">Incoming Service Requests</h2>
                <p className="mech-section-subtitle">
                  Nearby stranded vehicle owners requesting roadside assistance ({incomingRequests.length})
                </p>
              </div>
            </div>
            {isOnline ? (
              <span className="live-radar-tag">
                <span className="radar-dot" /> Live Dispatch Radar Active
              </span>
            ) : (
              <span className="paused-radar-tag">Radar Paused (Offline)</span>
            )}
          </div>

          {incomingRequests.length === 0 ? (
            <div className="mech-empty-card">
              <Clock size={36} className="empty-icon" />
              <h3>No Pending Service Requests</h3>
              <p>
                {isOnline
                  ? 'You are active on the dispatch grid! New emergency breakdown requests in your radius will alert here in real-time.'
                  : 'You are currently offline. Turn your availability online to start receiving requests.'}
              </p>
              {!isOnline && (
                <button type="button" className="btn btn-primary" onClick={toggleAvailability}>
                  Turn Online
                </button>
              )}
            </div>
          ) : (
            <div className="incoming-requests-grid">
              {incomingRequests.map((req) => (
                <div key={req.id} className="incoming-request-card">
                  <div className="req-card-top">
                    <div className="req-vehicle-info">
                      <div className="vehicle-type-tag">
                        {getVehicleIcon(req.vehicleType)}
                        <span>{req.vehicleType}</span>
                      </div>
                      <span className="req-time-stamp">{req.requestedAt}</span>
                    </div>
                    <div className="req-charge-tag">
                      {formatCurrency(req.estimatedCharge)}
                    </div>
                  </div>

                  <h3 className="req-vehicle-model">{req.vehicleModel}</h3>

                  <div className="req-problem-banner">
                    <span className="problem-label">Reported Issue:</span>
                    <strong className="problem-category">{req.problemCategory}</strong>
                    <p className="problem-desc">{req.description}</p>
                  </div>

                  <div className="req-location-box">
                    <div className="req-location-row">
                      <MapPin size={16} className="loc-pin" />
                      <span className="location-text">{req.location}</span>
                    </div>
                    <div className="distance-badge">
                      <Navigation size={13} />
                      <span>{req.distance} km away</span>
                    </div>
                  </div>

                  <div className="req-customer-footer">
                    <div className="customer-info-row">
                      <span className="customer-name">👤 {req.customerName}</span>
                      <a href={`tel:${req.customerPhone}`} className="customer-phone-link">
                        <Phone size={13} /> {req.customerPhone}
                      </a>
                    </div>

                    <div className="req-actions-row">
                      <button
                        type="button"
                        className="btn-req-reject"
                        onClick={() => handleRejectRequest(req.id)}
                      >
                        <X size={16} /> Decline
                      </button>
                      <button
                        type="button"
                        className="btn-req-accept"
                        onClick={() => handleAcceptRequest(req)}
                      >
                        <Check size={16} /> Accept Job
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            E. ACTIVE JOBS (ACCEPTED SERVICE REQUESTS)
           ========================================================= */}
        <section className="mech-section" id="active-jobs">
          <div className="mech-section-header">
            <div className="section-title-wrap">
              <div className="section-icon-badge purple">
                <PlayCircle size={18} />
              </div>
              <div>
                <h2 className="mech-section-title">Active Service Jobs</h2>
                <p className="mech-section-subtitle">
                  Track and progress jobs you have accepted ({activeJobs.length})
                </p>
              </div>
            </div>
          </div>

          {activeJobs.length === 0 ? (
            <div className="mech-empty-card">
              <PlayCircle size={36} className="empty-icon" />
              <h3>No Active Jobs</h3>
              <p>You have no ongoing repairs in progress. Accept an incoming request above to begin dispatch!</p>
            </div>
          ) : (
            <div className="active-jobs-list">
              {activeJobs.map((job) => {
                const currentStatusIdx = JOB_STATUSES.indexOf(job.status);
                return (
                  <div key={job.id} className="active-job-card">
                    <div className="active-job-header">
                      <div>
                        <div className="job-id-pill">{job.id}</div>
                        <h3 className="job-vehicle-name">{job.vehicleModel}</h3>
                        <p className="job-problem-summary">
                          <strong>{job.problemCategory}:</strong> {job.description}
                        </p>
                      </div>

                      <div className="job-charge-box">
                        <span className="charge-title">Service Charge</span>
                        <span className="charge-amount">{formatCurrency(job.estimatedCharge)}</span>
                      </div>
                    </div>

                    <div className="job-meta-row">
                      <div className="meta-item">
                        <MapPin size={15} color="var(--accent-primary)" />
                        <span>{job.location}</span>
                      </div>
                      <div className="meta-item">
                        <Phone size={15} color="var(--accent-secondary)" />
                        <span>Customer: <strong>{job.customerName}</strong> ({job.customerPhone})</span>
                      </div>
                    </div>

                    {/* Step-by-Step Progress Pipeline */}
                    <div className="status-stepper-container">
                      <div className="stepper-title">Job Milestone Tracker:</div>
                      <div className="stepper-steps">
                        {JOB_STATUSES.map((step, idx) => {
                          const isCompleted = idx < currentStatusIdx;
                          const isCurrent = idx === currentStatusIdx;
                          return (
                            <div
                              key={step}
                              className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                            >
                              <div className="step-circle">
                                {isCompleted ? <Check size={14} /> : idx + 1}
                              </div>
                              <span className="step-name">{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status Update Action Controls */}
                    <div className="job-controls-row">
                      <span className="controls-label">Update Milestone:</span>
                      <div className="status-buttons-wrap">
                        {JOB_STATUSES.map((statusOption) => {
                          const isCurrent = job.status === statusOption;
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              className={`btn-status-step ${isCurrent ? 'active' : ''} ${statusOption === 'Completed' ? 'complete-step' : ''}`}
                              onClick={() => handleUpdateJobStatus(job.id, statusOption)}
                            >
                              {statusOption === 'Completed' ? <CheckCircle2 size={14} /> : null}
                              {statusOption}
                              {isCurrent && ' (Current)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================================================
            F. RECENT COMPLETED JOBS
           ========================================================= */}
        <section className="mech-section" id="completed">
          <div className="mech-section-header">
            <div className="section-title-wrap">
              <div className="section-icon-badge green">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="mech-section-title">Recent Completed Jobs</h2>
                <p className="mech-section-subtitle">
                  History of resolved roadside service requests and earnings
                </p>
              </div>
            </div>
          </div>

          <div className="completed-table-card">
            <div className="table-responsive">
              <table className="completed-jobs-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Service Performed</th>
                    <th>Date / Time</th>
                    <th>Amount Earned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobs.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="table-job-id">{item.id}</span>
                      </td>
                      <td>
                        <strong>{item.customerName}</strong>
                      </td>
                      <td>{item.vehicleModel}</td>
                      <td>{item.servicePerformed}</td>
                      <td className="table-date">{item.completedAt}</td>
                      <td>
                        <span className="table-earned-badge">
                          +{formatCurrency(item.amountEarned)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">
                          <Check size={12} /> {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </MechanicDashboardLayout>
  );
}
