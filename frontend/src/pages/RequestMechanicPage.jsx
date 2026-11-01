import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { mechanics } from '../data/mechanics';
import { useVehicles } from '../context/VehicleContext';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { generateId, formatCurrency } from '../utils/helpers';
import StatusBadge from '../components/common/StatusBadge';

const RequestMechanicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { vehicles, selectedVehicle } = useVehicles();

  const mechanic = mechanics.find((m) => m.id === id) || mechanics[0];

  const [serviceType, setServiceType] = useState(mechanic?.services[0] || 'General Inspection');
  const [vehicleId, setVehicleId] = useState(selectedVehicle?.id || (vehicles[0]?.id || ''));
  const [location, setLocation] = useState('Cyber City DLF Phase 2, Gurgaon, Haryana');
  const [urgency, setUrgency] = useState('immediate'); // 'immediate' or 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    const chosenVehicle = vehicles.find((v) => v.id === vehicleId) || selectedVehicle;

    const newRequest = {
      id: generateId(),
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      workshopName: mechanic.workshopName,
      mechanicPhone: mechanic.phone,
      serviceType,
      vehicleName: chosenVehicle
        ? `${chosenVehicle.make} ${chosenVehicle.model} (${chosenVehicle.registrationNumber})`
        : 'Registered Vehicle',
      location,
      urgency,
      scheduledTime: urgency === 'scheduled' ? scheduledTime : 'Immediate (Within 30 mins)',
      description,
      status: 'submitted',
      charge: mechanic.visitCharge,
      date: new Date().toISOString()
    };

    // Save to storage
    const existingRequests = storage.get(STORAGE_KEYS.REQUESTS) || [];
    storage.set(STORAGE_KEYS.REQUESTS, [newRequest, ...existingRequests]);
    storage.set(STORAGE_KEYS.ACTIVE_REQUEST, newRequest);

    setSubmittedRequest(newRequest);
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

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/dashboard" className="btn btn-primary">
                Return to Dashboard
              </Link>
              <Link to="/mechanics" className="btn btn-secondary">
                Book Another Service
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
