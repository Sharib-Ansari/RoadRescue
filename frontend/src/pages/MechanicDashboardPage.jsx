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
import { storage } from '../utils/storage';
import { formatCurrency, formatDate } from '../utils/helpers';
import authApi from '../utils/api';
import './MechanicDashboardPage.css';

// Initial realistic incoming mock service requests for mechanics
const INITIAL_INCOMING_REQUESTS = [
  {
    id: 'REQ-INC-201',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98201 12345',
    vehicleType: 'Car',
    vehicleModel: 'Hyundai Creta (DL 3C AB 8765)',
    problemCategory: 'Engine Problem',
    description: 'Engine stalled with check engine light flashing on the flyover.',
    location: 'Cyber Hub Phase 2, DLF Cyber City, Gurgaon',
    distance: 1.8,
    estimatedCharge: 650,
    requestedAt: '10 mins ago',
    status: 'pending'
  },
  {
    id: 'REQ-INC-202',
    customerName: 'Rohit Deshmukh',
    customerPhone: '+91 97654 32109',
    vehicleType: 'Motorcycle/Bike',
    vehicleModel: 'Royal Enfield Classic 350 (HR 26 DQ 5541)',
    problemCategory: 'Flat Tyre / Puncture',
    description: 'Rear tyre punctured near expressway service lane, urgent help needed.',
    location: 'NH-48 Near Rajiv Chowk Underpass, Gurgaon',
    distance: 2.4,
    estimatedCharge: 350,
    requestedAt: '18 mins ago',
    status: 'pending'
  },
  {
    id: 'REQ-INC-203',
    customerName: 'Priya Sundaram',
    customerPhone: '+91 98450 67890',
    vehicleType: 'Car',
    vehicleModel: 'Honda City i-VTEC (UP 16 AX 9921)',
    problemCategory: 'Battery Failure',
    description: 'Car won’t crank, clicking sound from starter relay. Need jumpstart.',
    location: 'Golf Course Road, Sector 54, Gurgaon',
    distance: 3.5,
    estimatedCharge: 450,
    requestedAt: '25 mins ago',
    status: 'pending'
  }
];

// Initial active job undergoing service
const INITIAL_ACTIVE_JOBS = [
  {
    id: 'JOB-ACT-101',
    customerName: 'Vikram Sethi',
    customerPhone: '+91 98111 44556',
    vehicleType: 'SUV',
    vehicleModel: 'Mahindra XUV700 (DL 8C AD 3311)',
    problemCategory: 'Brake Problem',
    description: 'Brake pedal feels spongy and warning message displayed on dashboard.',
    location: 'Sohna Road, Near Subhash Chowk, Gurgaon',
    distance: 2.1,
    estimatedCharge: 1200,
    status: 'On The Way', // 'Accepted', 'On The Way', 'Arrived', 'Repair In Progress', 'Completed'
    acceptedAt: '2024-01-20T10:15:00Z'
  }
];

// Initial completed job records
const INITIAL_COMPLETED_JOBS = [
  {
    id: 'JOB-CMP-091',
    customerName: 'Neha Kapoor',
    vehicleModel: 'Maruti Suzuki Swift (HR 51 BZ 2234)',
    servicePerformed: 'Flat Tyre Replacement & Wheel Balancing',
    amountEarned: 550,
    completedAt: 'Today, 09:30 AM',
    status: 'Completed',
    rating: 5.0
  },
  {
    id: 'JOB-CMP-090',
    customerName: 'Sunil Bhatia',
    vehicleModel: 'Tata Nexon EV (DL 10 CE 1109)',
    servicePerformed: '12V Auxiliary Battery Boost & Diagnostics',
    amountEarned: 750,
    completedAt: 'Yesterday, 04:45 PM',
    status: 'Completed',
    rating: 4.9
  },
  {
    id: 'JOB-CMP-089',
    customerName: 'Kunal Singhania',
    vehicleModel: 'Kia Seltos (HR 26 CX 8802)',
    servicePerformed: 'Coolant Hose Leak Repair & Top-up',
    amountEarned: 1400,
    completedAt: '28 Jan 2024, 02:15 PM',
    status: 'Completed',
    rating: 4.8
  }
];

const JOB_STATUSES = [
  'Accepted',
  'On The Way',
  'Arrived',
  'Repair In Progress',
  'Completed'
];

export default function MechanicDashboardPage() {
  const { user } = useAuth();

  // Availability state (persisted in localStorage & MongoDB)
  const [isOnline, setIsOnline] = useState(() => {
    if (user?.mechanicProfile?.isAvailable !== undefined) {
      return user.mechanicProfile.isAvailable;
    }
    const saved = storage.get('roadrescue_mechanic_online');
    return saved !== null ? saved : true;
  });

  // State for incoming requests
  const [incomingRequests, setIncomingRequests] = useState(() => {
    return storage.get('roadrescue_mechanic_incoming') || INITIAL_INCOMING_REQUESTS;
  });

  // State for active jobs
  const [activeJobs, setActiveJobs] = useState(() => {
    return storage.get('roadrescue_mechanic_active') || INITIAL_ACTIVE_JOBS;
  });

  // State for completed jobs
  const [completedJobs, setCompletedJobs] = useState(() => {
    return storage.get('roadrescue_mechanic_completed') || INITIAL_COMPLETED_JOBS;
  });

  // Action feedback banner
  const [actionAlert, setActionAlert] = useState(null);

  // Fetch real requests from MongoDB
  const fetchMechanicData = async () => {
    try {
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
            distance: 2.1,
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

        if (dbIncoming.length > 0) setIncomingRequests(dbIncoming);
        if (dbActive.length > 0) setActiveJobs(dbActive);
        if (dbCompleted.length > 0) setCompletedJobs(dbCompleted);
      }
    } catch (err) {
      console.warn('Could not fetch requests from backend API, using local state:', err.message);
    }
  };

  useEffect(() => {
    fetchMechanicData();
  }, []);

  // Sync state changes with localStorage
  useEffect(() => {
    storage.set('roadrescue_mechanic_online', isOnline);
  }, [isOnline]);

  useEffect(() => {
    storage.set('roadrescue_mechanic_incoming', incomingRequests);
  }, [incomingRequests]);

  useEffect(() => {
    storage.set('roadrescue_mechanic_active', activeJobs);
  }, [activeJobs]);

  useEffect(() => {
    storage.set('roadrescue_mechanic_completed', completedJobs);
  }, [completedJobs]);

  const toggleAvailability = async () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    // Persist to MongoDB
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
    // 1. If it is a real DB record, update status on backend
    const targetId = request.dbId || request.id;
    try {
      if (!targetId.startsWith('REQ-')) {
        await authApi.updateRequestStatus(targetId, 'accepted', 'Mechanic accepted the request');
      }
    } catch (err) {
      console.warn('API error accepting request:', err.message);
    }

    // Remove from incoming
    setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));

    // Add to active jobs
    const newJob = {
      ...request,
      status: 'Accepted',
      acceptedAt: new Date().toISOString()
    };
    setActiveJobs((prev) => [newJob, ...prev]);

    setActionAlert({
      type: 'success',
      message: `Accepted request from ${request.customerName}. Job added to Active Jobs!`
    });
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Reject incoming request
  const handleRejectRequest = (requestId) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    setActionAlert({
      type: 'info',
      message: 'Request declined and passed to the next available workshop partner.'
    });
    setTimeout(() => setActionAlert(null), 3000);
  };

  // Advance or set job status
  const handleUpdateJobStatus = async (jobId, newStatus) => {
    const job = activeJobs.find((j) => j.id === jobId);
    if (!job) return;

    // 1. Sync with backend API
    const targetId = job.dbId || job.id;
    try {
      if (!targetId.startsWith('JOB-') && !targetId.startsWith('REQ-')) {
        const backendStatus = newStatus.toLowerCase().replace(/\s+/g, '_');
        await authApi.updateRequestStatus(targetId, backendStatus, `Milestone updated to ${newStatus}`);
      }
    } catch (err) {
      console.warn('API error updating status:', err.message);
    }

    if (newStatus === 'Completed') {
      // Remove from active
      setActiveJobs((prev) => prev.filter((j) => j.id !== jobId));

      // Add to completed jobs
      const completedEntry = {
        id: job.id.replace('JOB-ACT', 'JOB-CMP').replace('REQ-INC', 'JOB-CMP'),
        customerName: job.customerName,
        vehicleModel: job.vehicleModel,
        servicePerformed: `${job.problemCategory} Resolution & Testing`,
        amountEarned: job.estimatedCharge,
        completedAt: 'Just now',
        status: 'Completed',
        rating: 5.0
      };
      setCompletedJobs((prev) => [completedEntry, ...prev]);

      setActionAlert({
        type: 'success',
        message: `Job completed! Earned ${formatCurrency(job.estimatedCharge)} added to your earnings balance.`
      });
      setTimeout(() => setActionAlert(null), 5000);
    } else {
      setActiveJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      setActionAlert({
        type: 'info',
        message: `Job status updated to: ${newStatus}`
      });
      setTimeout(() => setActionAlert(null), 3000);
    }
  };

  // Computed statistics
  const totalEarnings = completedJobs.reduce((acc, job) => acc + (Number(job.amountEarned) || 0), 4500);
  const totalRequestsCount = incomingRequests.length + activeJobs.length + completedJobs.length + 12;

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
              <span className="stat-value">{completedJobs.length + 18}</span>
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
                <TrendingUp size={13} /> +18.4% this week
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
