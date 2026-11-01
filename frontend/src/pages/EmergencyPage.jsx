import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  CircleDot,
  Battery,
  Disc,
  Link as LinkIcon,
  Fuel,
  Thermometer,
  Zap,
  HelpCircle,
  MapPin,
  Search,
  Car,
  Bike,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { generateId } from '../utils/helpers';
import DashboardLayout from '../layouts/DashboardLayout';
import './EmergencyPage.css';

// 9 Problem Categories
const PROBLEM_CATEGORIES = [
  { id: 'Engine Problem', label: 'Engine Problem', icon: AlertTriangle, desc: "Stalling, knocking, won't start" },
  { id: 'Flat Tyre / Puncture', label: 'Flat Tyre / Puncture', icon: CircleDot, desc: 'Punctured, blowout, low pressure' },
  { id: 'Battery Failure', label: 'Battery Failure', icon: Battery, desc: 'Dead battery, jumpstart needed' },
  { id: 'Brake Problem', label: 'Brake Problem', icon: Disc, desc: 'Brake fade, squealing, fluid leak' },
  { id: 'Chain / Clutch Problem', label: 'Chain / Clutch Problem', icon: LinkIcon, desc: 'Broken chain, slipping clutch' },
  { id: 'Fuel Problem', label: 'Fuel Problem', icon: Fuel, desc: 'Out of fuel, contaminated diesel' },
  { id: 'Overheating', label: 'Overheating', icon: Thermometer, desc: 'Steam from hood, radiator leak' },
  { id: 'Electrical Problem', label: 'Electrical Problem', icon: Zap, desc: 'Headlights dead, wiring short' },
  { id: 'Other Problem', label: 'Other Problem', icon: HelpCircle, desc: 'Lockout, towing, general breakdown' }
];

const QUICK_LOCATIONS = [
  'NH-48 Expressway, Sector 29 Exit, Gurgaon',
  'DLF Cyber City, Phase 2, Gurgaon',
  'Outer Ring Road, Near Bellandur, Bengaluru',
  'Western Express Highway, Andheri East, Mumbai'
];

export const EmergencyPage = () => {
  const navigate = useNavigate();
  const { vehicles, selectedVehicle } = useVehicles();

  const [selectedProblem, setSelectedProblem] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper icon for vehicle type
  const getVehicleIcon = (type = '') => {
    const t = type.toLowerCase();
    if (t.includes('bike') || t.includes('motorcycle') || t.includes('scooter')) {
      return <Bike className="vehicle-type-icon" size={24} />;
    }
    if (t.includes('truck') || t.includes('commercial')) {
      return <Truck className="vehicle-type-icon" size={24} />;
    }
    return <Car className="vehicle-type-icon" size={24} />;
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({
        ...prev,
        location: 'Geolocation is not supported by your browser. Please enter manually.'
      }));
      return;
    }

    setIsLocating(true);
    setErrors(prev => ({ ...prev, location: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const latFormatted = latitude.toFixed(4);
        const lngFormatted = longitude.toFixed(4);
        const detectedAddress = `Near NH-48 Highway, Sector 29 (${latFormatted}° N, ${lngFormatted}° E)`;
        
        setLocation(detectedAddress);
        setLocationSuccess(true);
        setIsLocating(false);
        setErrors(prev => ({ ...prev, location: null }));
      },
      (error) => {
        setIsLocating(false);
        setLocationSuccess(false);
        let errorMsg = 'Location access denied. Please enter your location manually.';
        if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please enter manually.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Location information is unavailable. Please enter manually.';
        }
        setErrors(prev => ({ ...prev, location: errorMsg }));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!selectedVehicle) {
      newErrors.vehicle = 'No vehicle selected - Add a vehicle first';
    }

    if (!selectedProblem) {
      newErrors.problem = 'Please select a problem category';
    }

    if (!location.trim()) {
      newErrors.location = 'Please enter your current location or use auto-detect.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const emergencyRequest = {
      id: generateId(),
      vehicleId: selectedVehicle.id,
      vehicleName: `${selectedVehicle.brand} ${selectedVehicle.model}`,
      vehicleReg: selectedVehicle.registrationNumber,
      problemCategory: selectedProblem,
      description: description.trim(),
      location: location.trim(),
      timestamp: new Date().toISOString(),
      status: 'searching'
    };

    // Save to local storage as specified in requirements
    storage.set(STORAGE_KEYS.EMERGENCY_DATA, emergencyRequest);
    storage.set(STORAGE_KEYS.ACTIVE_REQUEST, emergencyRequest);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/mechanics');
    }, 300);
  };

  return (
    <DashboardLayout title="Emergency Assistance">
      <div className="emergency-page">
        {/* Prototype Announcement Banner */}
        <div className="prototype-banner">
          <div className="banner-content">
            <span className="banner-pulse-dot" />
            <AlertTriangle className="banner-icon" size={18} />
            <span className="banner-text">
              DEMO MODE - This is a frontend prototype. Submitting a request will simulate finding nearby mechanics.
            </span>
          </div>
        </div>

        <div className="emergency-layout">
          {/* LEFT COLUMN: Emergency Request Form */}
          <div className="emergency-main">
            <div className="emergency-header-card">
              <div className="header-badge">
                <span className="sos-glow-circle" />
                <span>RAPID DISPATCH UNIT</span>
              </div>
              <h2 className="emergency-main-title">Request Roadside Rescue</h2>
              <p className="emergency-subtext">
                Tell us what happened and where you are stranded. We will locate the closest verified technician with appropriate equipment.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* SECTION 1: Selected Vehicle */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="section-number">1</div>
                  <div className="section-title-wrap">
                    <h3 className="section-title">Selected Vehicle</h3>
                    <p className="section-desc">The vehicle needing immediate assistance</p>
                  </div>
                  {selectedVehicle && (
                    <Link to="/vehicles" className="change-vehicle-link">
                      Change Vehicle
                    </Link>
                  )}
                </div>

                {errors.vehicle && (
                  <div className="form-alert-error">
                    <AlertCircle size={18} />
                    <span>{errors.vehicle}</span>
                  </div>
                )}

                {selectedVehicle ? (
                  <div className="selected-vehicle-display">
                    <div className="vehicle-icon-box">
                      {getVehicleIcon(selectedVehicle.type)}
                    </div>
                    <div className="vehicle-details">
                      <div className="vehicle-brand-model">
                        {selectedVehicle.brand} {selectedVehicle.model}
                        <span className="vehicle-type-tag">{selectedVehicle.type || 'Car'}</span>
                      </div>
                      <div className="vehicle-meta-row">
                        <span className="meta-reg">
                          <span className="reg-badge">{selectedVehicle.registrationNumber}</span>
                        </span>
                        {selectedVehicle.fuelType && (
                          <span className="meta-fuel">• Fuel: {selectedVehicle.fuelType}</span>
                        )}
                        {selectedVehicle.year && (
                          <span className="meta-year">• Model Year: {selectedVehicle.year}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-vehicle-warning">
                    <AlertCircle className="warning-icon" size={32} />
                    <div className="warning-text">
                      <h4>No vehicle selected - Add a vehicle first</h4>
                      <p>
                        {vehicles && vehicles.length > 0
                          ? 'Please pick an active vehicle from your garage so mechanics bring matching tools.'
                          : 'You need to register at least one vehicle to request roadside service.'}
                      </p>
                    </div>
                    <Link to="/vehicles" className="btn btn-primary btn-sm">
                      Go to My Vehicles
                    </Link>
                  </div>
                )}
              </div>

              {/* SECTION 2: Problem Category */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="section-number">2</div>
                  <div className="section-title-wrap">
                    <h3 className="section-title">What's the problem?</h3>
                    <p className="section-desc">Select the category that best matches your issue</p>
                  </div>
                  <span className="required-tag">Required</span>
                </div>

                {errors.problem && (
                  <div className="form-alert-error">
                    <AlertCircle size={18} />
                    <span>{errors.problem}</span>
                  </div>
                )}

                <div className="problems-grid">
                  {PROBLEM_CATEGORIES.map((cat) => {
                    const IconComponent = cat.icon;
                    const isSelected = selectedProblem === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => {
                          setSelectedProblem(cat.id);
                          setErrors(prev => ({ ...prev, problem: null }));
                        }}
                        className={`problem-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="problem-icon-wrapper">
                          <IconComponent size={22} />
                        </div>
                        <span className="problem-label">{cat.label}</span>
                        {isSelected && (
                          <div className="problem-check-badge">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Problem Description */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="section-number">3</div>
                  <div className="section-title-wrap">
                    <h3 className="section-title">Describe the problem (optional)</h3>
                    <p className="section-desc">Add details to help the mechanic diagnose faster</p>
                  </div>
                </div>

                <div className="textarea-wrapper">
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details about the issue..."
                    className="form-textarea emergency-textarea"
                  />
                  <div className="textarea-footer">
                    <span className="char-count">{description.length}/500 characters</span>
                  </div>
                </div>

                {/* Quick description chips */}
                <div className="quick-desc-chips">
                  <span className="quick-desc-label">Quick suggestions:</span>
                  {[
                    "Won't crank at all",
                    'White smoke from engine',
                    'Flat tyre on highway shoulder',
                    'Strange knocking noise'
                  ].map((chip) => (
                    <button
                      type="button"
                      key={chip}
                      onClick={() => {
                        setDescription(prev => (prev ? `${prev}. ${chip}` : chip).slice(0, 500));
                      }}
                      className="quick-chip-btn"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Your Location */}
              <div className="form-section-card">
                <div className="section-header">
                  <div className="section-number">4</div>
                  <div className="section-title-wrap">
                    <h3 className="section-title">Your Location</h3>
                    <p className="section-desc">Where should the rescue technician navigate to?</p>
                  </div>
                  <span className="required-tag">Required</span>
                </div>

                {errors.location && (
                  <div className="form-alert-error">
                    <AlertCircle size={18} />
                    <span>{errors.location}</span>
                  </div>
                )}

                <div className="location-action-bar">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className={`btn btn-secondary locate-me-btn ${isLocating ? 'locating' : ''}`}
                  >
                    {isLocating ? (
                      <>
                        <span className="loading-spinner-sm" />
                        <span>Detecting GPS Coordinates...</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={18} className="pin-icon" />
                        <span>Use My Current Location</span>
                      </>
                    )}
                  </button>

                  <span className="location-divider-text">or enter manually below</span>
                </div>

                <div className="manual-location-input-wrap">
                  <MapPin size={20} className="input-location-icon" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLocationSuccess(false);
                      setErrors(prev => ({ ...prev, location: null }));
                    }}
                    placeholder="Enter your current address or landmark"
                    className="form-input location-input"
                  />
                  {location && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocation('');
                        setLocationSuccess(false);
                      }}
                      className="clear-input-btn"
                      title="Clear location"
                    >
                      ×
                    </button>
                  )}
                </div>

                {locationSuccess && (
                  <div className="location-success-chip">
                    <CheckCircle2 size={16} />
                    <span>Location locked via Browser GPS</span>
                  </div>
                )}

                {/* Preset landmark recommendations */}
                <div className="preset-locations-wrap">
                  <span className="preset-label">Demo locations:</span>
                  <div className="preset-chips">
                    {QUICK_LOCATIONS.map((loc) => (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => {
                          setLocation(loc);
                          setLocationSuccess(false);
                          setErrors(prev => ({ ...prev, location: null }));
                        }}
                        className="preset-chip"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="emergency-submit-container">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-emergency-submit"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner-sm" />
                      <span>Transmitting Distress Signal...</span>
                    </>
                  ) : (
                    <>
                      <Search size={22} />
                      <span>Find Nearby Assistance</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
                <p className="emergency-button-hint">
                  Instant search across verified mobile rescue garages in your radius
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Live Summary & RoadRescue Trust Panel */}
          <aside className="emergency-sidebar">
            <div className="summary-sticky-card">
              <div className="summary-card-header">
                <div className="summary-title-row">
                  <h3 className="summary-title">Request Summary</h3>
                  <span className="summary-live-tag">
                    <span className="live-dot" /> LIVE PREVIEW
                  </span>
                </div>
                <p className="summary-subtitle">Details sent to dispatched workshops</p>
              </div>

              <div className="summary-body">
                {/* Vehicle Row */}
                <div className="summary-row">
                  <div className="row-icon">
                    <Car size={18} />
                  </div>
                  <div className="row-content">
                    <span className="row-label">Vehicle</span>
                    <span className="row-value font-medium">
                      {selectedVehicle
                        ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.registrationNumber})`
                        : <span className="text-muted">No vehicle selected</span>}
                    </span>
                  </div>
                </div>

                {/* Problem Row */}
                <div className="summary-row">
                  <div className="row-icon">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="row-content">
                    <span className="row-label">Problem Category</span>
                    <span className="row-value">
                      {selectedProblem ? (
                        <span className="problem-highlight-badge">{selectedProblem}</span>
                      ) : (
                        <span className="text-muted">None selected yet</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Location Row */}
                <div className="summary-row">
                  <div className="row-icon">
                    <MapPin size={18} />
                  </div>
                  <div className="row-content">
                    <span className="row-label">Location</span>
                    <span className="row-value location-text">
                      {location.trim() ? (
                        location
                      ) : (
                        <span className="text-muted">Awaiting location input</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Description Preview (if any) */}
                {description.trim() && (
                  <div className="summary-row notes-row">
                    <div className="row-icon">
                      <Info size={18} />
                    </div>
                    <div className="row-content">
                      <span className="row-label">Notes</span>
                      <p className="row-notes-text">"{description}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Response Time Metric */}
              <div className="metric-box">
                <div className="metric-icon-wrap">
                  <Clock size={24} />
                </div>
                <div className="metric-info">
                  <span className="metric-label">Average Response Time</span>
                  <div className="metric-value">12-18 minutes</div>
                  <span className="metric-sub">Fastest emergency corridor coverage</span>
                </div>
              </div>

              {/* Why RoadRescue Advantages */}
              <div className="trust-benefits-card">
                <h4 className="trust-heading">Why use RoadRescue?</h4>
                <ul className="trust-list">
                  <li className="trust-item">
                    <ShieldCheck className="trust-icon" size={18} />
                    <div>
                      <strong>Verified & Inspected Mechanics</strong>
                      <p>Every service provider undergoes background screening and technical checks.</p>
                    </div>
                  </li>
                  <li className="trust-item">
                    <Clock className="trust-icon" size={18} />
                    <div>
                      <strong>Rapid Response</strong>
                      <p>Dispatched from the nearest emergency outpost within 12-18 minutes.</p>
                    </div>
                  </li>
                  <li className="trust-item">
                    <Tag className="trust-icon" size={18} />
                    <div>
                      <strong>Transparent Pricing</strong>
                      <p>Standard inspection charges with no hidden highway surprises.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Prototype notice */}
              <div className="sidebar-disclaimer">
                <p>
                  This is a frontend prototype. No actual mechanic will be contacted.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmergencyPage;
