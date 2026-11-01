import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  Wrench,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Info,
  Car,
  Filter,
  ShieldCheck,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { mechanics } from '../data/mechanics';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { formatCurrency, getInitials } from '../utils/helpers';
import DashboardLayout from '../layouts/DashboardLayout';
import './MechanicsPage.css';

const SERVICE_OPTIONS = [
  { value: 'all', label: 'All Services' },
  { value: 'Engine Repair', label: 'Engine Repair' },
  { value: 'Tyre Service', label: 'Tyre Service' },
  { value: 'Battery', label: 'Battery' },
  { value: 'Brakes', label: 'Brakes' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Towing', label: 'Towing' }
];

export const MechanicsPage = () => {
  const navigate = useNavigate();

  // Emergency request context from localStorage
  const [emergencyData, setEmergencyData] = useState(() => {
    return storage.get(STORAGE_KEYS.EMERGENCY_DATA);
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [selectedAvailability, setSelectedAvailability] = useState('all'); // 'all', 'available', 'any'
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'distance', 'price'

  // Pre-filter by emergency category if relevant
  useEffect(() => {
    if (emergencyData && emergencyData.problemCategory) {
      const problem = emergencyData.problemCategory.toLowerCase();
      if (problem.includes('engine')) setSelectedService('Engine Repair');
      else if (problem.includes('tyre') || problem.includes('puncture')) setSelectedService('Tyre Service');
      else if (problem.includes('battery')) setSelectedService('Battery');
      else if (problem.includes('brake')) setSelectedService('Brakes');
      else if (problem.includes('electrical')) setSelectedService('Electrical');
      else if (problem.includes('clutch') || problem.includes('chain')) setSelectedService('all');
      else if (problem.includes('fuel')) setSelectedService('all');
    }
  }, [emergencyData]);

  const handleClearEmergency = () => {
    storage.remove(STORAGE_KEYS.EMERGENCY_DATA);
    setEmergencyData(null);
    setSelectedService('all');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedService('all');
    setSelectedAvailability('all');
    setSortBy('rating');
  };

  const isFilterActive = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedService !== 'all' ||
      selectedAvailability !== 'all' ||
      sortBy !== 'rating'
    );
  }, [searchQuery, selectedService, selectedAvailability, sortBy]);

  // Client-side filtering and sorting
  const filteredMechanics = useMemo(() => {
    return mechanics
      .filter((mechanic) => {
        // Search query filter (name, workshopName, services)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = mechanic.name.toLowerCase().includes(q);
          const workshopMatch = mechanic.workshopName.toLowerCase().includes(q);
          const locationMatch = mechanic.location?.toLowerCase().includes(q);
          const servicesMatch = mechanic.services.some(s => s.toLowerCase().includes(q));
          const specializationMatch = mechanic.specialization?.toLowerCase().includes(q);

          if (!nameMatch && !workshopMatch && !locationMatch && !servicesMatch && !specializationMatch) {
            return false;
          }
        }

        // Service Type filter
        if (selectedService !== 'all') {
          const sQuery = selectedService.toLowerCase();
          const hasService = mechanic.services.some(svc => {
            const sLower = svc.toLowerCase();
            if (sQuery === 'tyre service') return sLower.includes('tyre') || sLower.includes('puncture');
            if (sQuery === 'battery') return sLower.includes('battery');
            if (sQuery === 'brakes') return sLower.includes('brake');
            if (sQuery === 'electrical') return sLower.includes('electrical') || sLower.includes('sensor') || sLower.includes('wiring') || sLower.includes('starter') || sLower.includes('alternator');
            if (sQuery === 'towing') return sLower.includes('towing') || sLower.includes('flatbed');
            if (sQuery === 'engine repair') return sLower.includes('engine');
            return sLower.includes(sQuery);
          });
          if (!hasService) return false;
        }

        // Availability filter
        if (selectedAvailability === 'available') {
          if (!mechanic.isAvailable) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        if (sortBy === 'distance') {
          return a.distance - b.distance;
        }
        if (sortBy === 'price') {
          return a.visitCharge - b.visitCharge;
        }
        return 0;
      });
  }, [searchQuery, selectedService, selectedAvailability, sortBy]);

  // Avatar color generator based on mechanic initials
  const getAvatarBg = (id) => {
    const colors = [
      'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      'linear-gradient(135deg, #10B981 0%, #047857 100%)',
      'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    ];
    const index = (id.charCodeAt(id.length - 1) || 0) % colors.length;
    return colors[index];
  };

  return (
    <DashboardLayout title="Find Mechanics">
      <div className="mechanics-page">
        {/* Emergency context banner if emergencyData exists */}
        {emergencyData && (
          <div className="emergency-context-banner">
            <div className="banner-left">
              <div className="banner-alert-icon">
                <AlertTriangle size={20} />
              </div>
              <div className="banner-text-details">
                <div className="banner-title-line">
                  <span className="banner-badge-sos">SOS ACTIVE</span>
                  <span className="banner-main-text">
                    Searching mechanics for: <strong>{emergencyData.problemCategory}</strong> near <strong>{emergencyData.location}</strong>
                  </span>
                </div>
                {emergencyData.vehicleName && (
                  <div className="banner-vehicle-info">
                    <Car size={14} />
                    <span>Assisting: {emergencyData.vehicleName} ({emergencyData.vehicleReg})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="banner-actions">
              <Link to="/emergency" className="btn btn-sm btn-outline">
                Modify SOS
              </Link>
              <button
                type="button"
                onClick={handleClearEmergency}
                className="btn btn-sm btn-ghost clear-sos-btn"
                title="Dismiss SOS banner"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mechanics-header-row">
          <div className="header-text-block">
            <div className="header-title-badge">
              <ShieldCheck size={16} />
              <span>VERIFIED NETWORK</span>
            </div>
            <h2 className="mechanics-title">Find Nearby Mechanics</h2>
            <p className="mechanics-subtitle">
              Connect with certified roadside specialists and mobile workshops within minutes.
            </p>
          </div>

          <div className="results-counter-pill">
            <span className="counter-number">{filteredMechanics.length}</span>
            <span className="counter-label">
              {filteredMechanics.length === 1 ? 'mechanic found' : 'mechanics found in your area'}
            </span>
          </div>
        </div>

        {/* Search & Filters Controls Bar */}
        <div className="filters-control-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, workshop, or service..."
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-dropdowns-row">
            {/* Service Filter */}
            <div className="filter-select-wrap">
              <label htmlFor="service-filter" className="filter-select-label">
                Service:
              </label>
              <select
                id="service-filter"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="filter-select"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Filter */}
            <div className="filter-select-wrap">
              <label htmlFor="avail-filter" className="filter-select-label">
                Availability:
              </label>
              <select
                id="avail-filter"
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="available">Available Now</option>
                <option value="any">Any Status</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-select-wrap">
              <label htmlFor="sort-filter" className="filter-select-label">
                Sort by:
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="rating">Rating (High to Low)</option>
                <option value="distance">Distance (Nearest First)</option>
                <option value="price">Price (Low to High)</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-outline btn-clear-filters"
              >
                <RotateCcw size={15} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Mechanics Grid */}
        {filteredMechanics.length > 0 ? (
          <div className="mechanics-grid">
            {filteredMechanics.map((mechanic) => {
              const initials = getInitials(mechanic.name);
              const avatarStyle = { background: getAvatarBg(mechanic.id) };

              return (
                <div key={mechanic.id} className="mechanic-card">
                  {/* Top Header */}
                  <div className="card-top-section">
                    <div className="card-avatar" style={avatarStyle}>
                      {initials}
                    </div>

                    <div className="card-meta">
                      <div className="card-name-row">
                        <Link to={`/mechanics/${mechanic.id}`} className="mechanic-name-link">
                          <h3 className="mechanic-name">{mechanic.name}</h3>
                        </Link>
                        {mechanic.isAvailable ? (
                          <span className="status-badge badge-available">
                            <span className="status-dot-green" />
                            <span>Available</span>
                          </span>
                        ) : (
                          <span className="status-badge badge-busy">
                            <span className="status-dot-gray" />
                            <span>Busy</span>
                          </span>
                        )}
                      </div>

                      <div className="card-workshop">
                        <Wrench size={14} className="workshop-icon" />
                        <span>{mechanic.workshopName}</span>
                      </div>

                      <div className="card-ratings-distance">
                        <div className="rating-pill">
                          <Star size={14} className="star-icon" />
                          <span className="rating-number">{mechanic.rating.toFixed(1)}</span>
                          <span className="reviews-count">({mechanic.reviewCount} reviews)</span>
                        </div>

                        <span className="meta-separator">•</span>

                        <div className="distance-pill" title="Estimated distance based on GPS">
                          <MapPin size={14} className="distance-pin" />
                          <span>{mechanic.distance} km away</span>
                          <span className="demo-tag">(Demo distance)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specialization Pill if present */}
                  {mechanic.specialization && (
                    <div className="specialization-row">
                      <span className="spec-label">Specialist:</span>
                      <span className="spec-text">{mechanic.specialization}</span>
                    </div>
                  )}

                  {/* Services Chips */}
                  <div className="card-services-container">
                    <div className="services-chips-wrap">
                      {mechanic.services.slice(0, 4).map((service, idx) => (
                        <span key={idx} className="service-chip">
                          {service}
                        </span>
                      ))}
                      {mechanic.services.length > 4 && (
                        <span className="service-chip more-chip">
                          +{mechanic.services.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Experience, Visit Charge, and Actions */}
                  <div className="card-footer-section">
                    <div className="footer-stats">
                      <div className="exp-badge">
                        <Clock size={14} />
                        <span>{mechanic.experience} yrs exp</span>
                      </div>
                      <div className="visit-charge-badge">
                        <span className="charge-label">Visit:</span>
                        <span className="charge-amount">{formatCurrency(mechanic.visitCharge)}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <Link
                        to={`/mechanics/${mechanic.id}`}
                        className="btn btn-outline btn-sm action-btn-details"
                      >
                        View Details
                      </Link>

                      {mechanic.isAvailable ? (
                        <Link
                          to={`/request-mechanic/${mechanic.id}`}
                          className="btn btn-primary btn-sm action-btn-request"
                        >
                          Request Mechanic
                          <ArrowRight size={15} />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="btn btn-secondary btn-sm action-btn-disabled"
                          title="Mechanic is currently busy with another roadside emergency"
                        >
                          Currently Busy
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="no-mechanics-found">
            <div className="empty-icon-circle">
              <Search size={36} />
            </div>
            <h3 className="empty-title">No mechanics found</h3>
            <p className="empty-desc">
              We couldn't find any service provider matching your current filters. Try searching with different keywords or reset your filters.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-primary btn-md"
            >
              <RotateCcw size={16} />
              <span>Clear Filters & Show All</span>
            </button>
          </div>
        )}

        {/* Prototype Disclaimer Banner */}
        <div className="prototype-disclaimer-footer">
          <Info size={16} className="disclaimer-info-icon" />
          <span>
            Distances and availability shown are demonstration data for this prototype.
          </span>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MechanicsPage;
