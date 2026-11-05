import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  Car,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  ShieldCheck,
  FileText,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useVehicles } from '../context/VehicleContext';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { generateId, formatCurrency } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';
import authApi from '../utils/api';

const RequestMechanicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const incomingState = routerLocation.state || {};
  const { vehicles, selectedVehicle } = useVehicles();

  const [mechanic, setMechanic] = useState(() => {
    if (incomingState?.mechanic && (incomingState.mechanic.id === id || incomingState.mechanic._id === id)) {
      return incomingState.mechanic;
    }
    return {
      id,
      name: 'Loading Mechanic...',
      workshopName: 'RoadRescue Partner',
      phone: '+91 98765 12345',
      services: ['General Inspection', 'Engine Diagnostics'],
      visitCharge: 250,
      location: 'Local Region'
    };
  });

  useEffect(() => {
    const fetchMech = async () => {
      try {
        const res = await authApi.getMechanicById(id);
        if (res?.success && res.mechanic) {
          setMechanic({
            id: res.mechanic.id || res.mechanic._id,
            name: res.mechanic.name,
            workshopName: res.mechanic.mechanicProfile?.workshopName || 'Certified Workshop Partner',
            phone: res.mechanic.phone || '+91 98765 12345',
            services: res.mechanic.mechanicProfile?.services || ['General Inspection', 'Engine Diagnostics'],
            visitCharge: 250,
            location: res.mechanic.mechanicProfile?.serviceArea || 'Local Region'
          });
        }
      } catch (err) {
        console.warn('Could not fetch mechanic details:', err.message);
      }
    };
    if (id) {
      fetchMech();
    }
  }, [id]);

  const [serviceType, setServiceType] = useState(() => {
    if (incomingState.problemCategory) return incomingState.problemCategory;
    return 'General Inspection';
  });

  useEffect(() => {
    if (!incomingState.problemCategory && mechanic?.services?.length) {
      setServiceType(mechanic.services[0]);
    }
  }, [mechanic, incomingState.problemCategory]);

  const [vehicleId, setVehicleId] = useState(
    incomingState.vehicle?.id || incomingState.selectedVehicle?.id || selectedVehicle?.id || (vehicles[0]?.id || '')
  );
  const [location, setLocation] = useState(incomingState.location || '');
  const [urgency, setUrgency] = useState('immediate'); // 'immediate' or 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState(incomingState.description || '');
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const chosenVehicle = vehicles.find((v) => v.id === vehicleId) || incomingState.vehicle || incomingState.selectedVehicle || selectedVehicle;
    const vehicleDisplayName = chosenVehicle
      ? `${chosenVehicle.make || chosenVehicle.brand} ${chosenVehicle.model}`
      : 'Registered Vehicle';
    const vehicleRegNumber = chosenVehicle?.registrationNumber || '';

    // Map serviceType to valid problemCategory
    let category = 'Other Problem';
    const stLower = (serviceType || '').toLowerCase();
    if (stLower.includes('engine')) category = 'Engine Problem';
    else if (stLower.includes('tyre') || stLower.includes('puncture')) category = 'Flat Tyre / Puncture';
    else if (stLower.includes('battery')) category = 'Battery Failure';
    else if (stLower.includes('brake')) category = 'Brake Problem';
    else if (stLower.includes('electrical')) category = 'Electrical Problem';
    else if (stLower.includes('fuel')) category = 'Fuel Problem';
    else if (stLower.includes('clutch') || stLower.includes('chain')) category = 'Chain / Clutch Problem';

    let backendRequestId = null;

    // 1. Send targeted request to MongoDB backend
    try {
      const response = await authApi.createRequest({
        requestedMechanicId: mechanic.id,
        mechanicId: mechanic.id,
        vehicleId: chosenVehicle?.id && !chosenVehicle.id.startsWith('veh_') ? chosenVehicle.id : undefined,
        vehicleName: vehicleDisplayName,
        vehicleReg: vehicleRegNumber,
        problemCategory: category,
        description: description || `${serviceType} requested at ${location}`,
        location: location || 'Current Customer Location',
        customerCoordinates: incomingState.coordinates || undefined,
        estimatedCharge: mechanic.visitCharge || 250
      });

      if (response?.success && response.request) {
        backendRequestId = response.request.requestId || response.request.id;
      }
    } catch (err) {
      console.warn('Backend service request failed:', err.message);
    }

    const newRequest = {
      id: backendRequestId || generateId(),
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      workshopName: mechanic.workshopName,
      mechanicPhone: mechanic.phone,
      serviceType,
      vehicleName: `${vehicleDisplayName} (${vehicleRegNumber})`,
      location,
      urgency,
      scheduledTime: urgency === 'scheduled' ? scheduledTime : 'Immediate (Within 30 mins)',
      description,
      status: 'submitted',
      charge: mechanic.visitCharge || 250,
      date: new Date().toISOString()
    };

    // Save to storage
    const existingRequests = storage.get(STORAGE_KEYS.REQUESTS) || [];
    storage.set(STORAGE_KEYS.REQUESTS, [newRequest, ...existingRequests]);
    storage.set(STORAGE_KEYS.ACTIVE_REQUEST, newRequest);

    setSubmittedRequest(newRequest);
    setIsSubmitting(false);
  };

  return (
    <DashboardLayout title="Request Service">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => navigate('/mechanics')}
            style={{ paddingLeft: 0 }}
          >
            <ArrowLeft size={16} /> Back to Directory
          </button>
        </div>

        {submittedRequest ? (
          /* Confirmation Screen */
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Service Request Placed Successfully!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
              {submittedRequest.workshopName} has received your request. The technician will call you shortly to confirm travel time.
            </p>

            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'left',
                marginBottom: '2rem',
                maxWidth: '560px',
                margin: '0 auto 2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Booking Reference:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{submittedRequest.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Technician:</span>
                <span style={{ fontWeight: 600 }}>{submittedRequest.mechanicName} ({submittedRequest.workshopName})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <span style={{ fontWeight: 600 }}>{submittedRequest.serviceType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
                <span style={{ fontWeight: 600 }}>{submittedRequest.vehicleName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Initial Visit Charge:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(submittedRequest.charge)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <StatusBadge status={submittedRequest.status} size="sm" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to={`/tracking/${submittedRequest.id}`} className="btn btn-primary">
                Track Dispatch Live
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          /* Request Form */
          <div>
            {/* Selected Mechanic Summary Banner */}
            <div
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Wrench size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{mechanic.workshopName}</h3>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {mechanic.name} • {mechanic.location} ({mechanic.distance} km away)
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doorstep Visit Fee</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCurrency(mechanic.visitCharge)}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Schedule On-Site Repair
              </h2>

              {/* Service Type Selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Service Required</label>
                <select
                  className="form-select"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {mechanic.services.map((s, idx) => (
                    <option key={idx} value={s}>
                      {s} {mechanic.serviceCharges?.[s] ? `(${mechanic.serviceCharges[s]})` : ''}
                    </option>
                  ))}
                  <option value="General Inspection / Diagnosis">General Inspection / Diagnosis</option>
                </select>
              </div>

              {/* Vehicle Selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Vehicle</label>
                <select
                  className="form-select"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} - {v.registrationNumber} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Address */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Breakdown or Service Location Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Apartment name, street, nearby landmark"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Urgency */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Timing</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setUrgency('immediate')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: urgency === 'immediate' ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                      border: `1px solid ${urgency === 'immediate' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: urgency === 'immediate' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Immediate Dispatch (ASAP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency('scheduled')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: urgency === 'scheduled' ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                      border: `1px solid ${urgency === 'scheduled' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                      color: urgency === 'scheduled' ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Schedule for Later
                  </button>
                </div>
              </div>

              {urgency === 'scheduled' && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Preferred Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="form-input"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              )}

              {/* Symptoms Description */}
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Describe Problem / Symptoms</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="e.g. Squeaking noise when braking, or engine won't crank after parking overnight."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-lg">
                Confirm Service Booking
              </button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RequestMechanicPage;
