import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Wrench,
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  DollarSign,
  Info,
  Car,
  XCircle
} from 'lucide-react';
import { mechanics as initialMechanics } from '../data/mechanics';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { formatCurrency, formatDate, getInitials } from '../utils/helpers';
import authApi from '../utils/api';
import DashboardLayout from '../layouts/DashboardLayout';
import './MechanicDetailPage.css';

export const MechanicDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find mechanic state with fallback
  const [mechanic, setMechanic] = useState(() => {
    return initialMechanics.find((m) => m.id === id) || null;
  });
  const [isLoading, setIsLoading] = useState(!mechanic);

  useEffect(() => {
    // If not found in static list or if id looks like MongoDB ObjectId (24 hex characters), fetch from backend
    const fetchMechanicDetails = async () => {
      try {
        const response = await authApi.getMechanicById(id);
        if (response?.success && response.mechanic) {
          const m = response.mechanic;
          setMechanic({
            id: m.id || m._id,
            name: m.name,
            workshopName: m.mechanicProfile?.workshopName || 'Certified Workshop Partner',
            rating: 4.9,
            reviewCount: 42,
            distance: 1.5,
            experience: m.mechanicProfile?.experience || 5,
            services: m.mechanicProfile?.services || ['Engine Repair', 'Tyre Service', 'Battery Jumpstart'],
            visitCharge: 250,
            isAvailable: m.mechanicProfile?.isAvailable !== false,
            specialization: 'Multi-Brand Assistance',
            location: m.mechanicProfile?.serviceArea || 'Delhi NCR / Gurgaon',
            phone: m.phone || '+91 98765 12345',
            email: m.email,
            about: `Certified RoadRescue service partner with ${m.mechanicProfile?.experience || 5} years of specialized roadside recovery experience. Fully verified garage partner with high satisfaction scores across engine diagnostics, tyre recovery, and roadside towing.`,
            reviews: [
              { id: 'rev_1', author: 'Rahul K.', rating: 5, date: '2024-01-18', comment: 'Very fast response time and transparent rates. Fixed my alternator belt in 20 minutes.' },
              { id: 'rev_2', author: 'Pooja V.', rating: 5, date: '2024-01-12', comment: 'Professional mechanic. Arrived with full tyre replacement gear.' }
            ],
            serviceCharges: {
              'Emergency Callout': '₹250',
              'Engine Diagnostics': '₹500 - ₹2,000',
              'Tyre Puncture & Replacement': '₹300 - ₹800',
              'Battery Jumpstart': '₹350 - ₹600'
            }
          });
        }
      } catch (err) {
        console.warn('Could not fetch mechanic by ID from API:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMechanicDetails();
  }, [id]);

  // Check if an emergency request is in progress
  const emergencyData = storage.get(STORAGE_KEYS.EMERGENCY_DATA);

  // If mechanic not found
  if (isLoading) {
    return (
      <DashboardLayout title="Loading Mechanic Details...">
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Retrieving certified mechanic partner details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!mechanic) {
    return (
      <DashboardLayout title="Mechanic Not Found">
        <div className="mechanic-not-found-card">
          <div className="not-found-icon-wrap">
            <XCircle size={48} />
          </div>
          <h2 className="not-found-title">Mechanic Not Found</h2>
          <p className="not-found-text">
            The mechanic profile you are trying to view does not exist or may have been removed from the platform.
          </p>
          <Link to="/mechanics" className="btn btn-primary">
            <ArrowLeft size={18} />
            <span>Back to All Mechanics</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const initials = getInitials(mechanic.name);

  // Render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= fullStars ? 'star-filled' : 'star-empty'}
        />
      );
    }
    return stars;
  };

  return (
    <DashboardLayout title={`${mechanic.name} - Profile`}>
      <div className="mechanic-detail-page">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="detail-top-nav">
          <Link to="/mechanics" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Mechanics</span>
          </Link>

          {emergencyData && (
            <div className="emergency-linked-chip">
              <AlertTriangle size={14} className="sos-chip-icon" />
              <span>Matching SOS: {emergencyData.problemCategory}</span>
            </div>
          )}
        </div>

        {/* Two-Column Layout */}
        <div className="detail-layout-grid">
          {/* LEFT COLUMN: Main Profile Info */}
          <div className="detail-main-column">
            {/* Profile Header Card */}
            <div className="profile-hero-card">
              <div className="hero-avatar-wrap">
                <div className="hero-avatar-circle">
                  {initials}
                </div>
                {mechanic.isAvailable ? (
                  <span className="avatar-badge-status available" title="Available for dispatch">
                    <span className="badge-pulse-dot" />
                  </span>
                ) : (
                  <span className="avatar-badge-status busy" title="Currently busy" />
                )}
              </div>

              <div className="hero-info-content">
                <div className="hero-badge-row">
                  {mechanic.isAvailable ? (
                    <span className="status-pill status-available">
                      <span className="status-dot green" />
                      <span>Available Now</span>
                    </span>
                  ) : (
                    <span className="status-pill status-busy">
                      <span className="status-dot gray" />
                      <span>Currently Busy</span>
                    </span>
                  )}
                  <span className="distance-pill-chip">
                    <MapPin size={12} />
                    <span>{mechanic.distance} km away (Demo)</span>
                  </span>
                </div>

                <h1 className="hero-mechanic-name">{mechanic.name}</h1>

                <div className="hero-workshop-title">
                  <Wrench size={16} className="workshop-wrench" />
                  <span>{mechanic.workshopName}</span>
                </div>

                <div className="hero-location-text">
                  <MapPin size={15} />
                  <span>{mechanic.location}</span>
                </div>

                <div className="hero-rating-row">
                  <div className="rating-stars-wrap">
                    {renderStars(mechanic.rating)}
                  </div>
                  <span className="rating-score-bold">{mechanic.rating.toFixed(1)}</span>
                  <span className="rating-reviews-label">
                    ({mechanic.reviewCount} verified customer reviews)
                  </span>
                </div>

                {mechanic.specialization && (
                  <div className="hero-specialization-badge">
                    <Award size={15} />
                    <span>Specialization: <strong>{mechanic.specialization}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            <div className="detail-content-card">
              <div className="card-section-heading">
                <div className="heading-icon-wrap">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="section-title">About the Mechanic</h3>
                  <p className="section-subtitle">Verified background and track record</p>
                </div>
              </div>

              <p className="mechanic-about-paragraph">{mechanic.about}</p>

              <div className="experience-highlight-pill">
                <Award size={18} className="pill-icon" />
                <span>
                  <strong>{mechanic.experience} years</strong> in the professional automotive service industry
                </span>
              </div>
            </div>

            {/* Services Offered Section */}
            <div className="detail-content-card">
              <div className="card-section-heading">
                <div className="heading-icon-wrap">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="section-title">Services Offered</h3>
                  <p className="section-subtitle">Capabilities and roadside repairs provided</p>
                </div>
              </div>

              <div className="services-list-grid">
                {mechanic.services.map((service, index) => (
                  <div key={index} className="service-detail-item">
                    <CheckCircle2 size={16} className="check-icon" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Charges Section */}
            {mechanic.serviceCharges && Object.keys(mechanic.serviceCharges).length > 0 && (
              <div className="detail-content-card">
                <div className="card-section-heading">
                  <div className="heading-icon-wrap">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h3 className="section-title">Standard Service Charges</h3>
                    <p className="section-subtitle">Transparent estimates for typical roadside jobs</p>
                  </div>
                </div>

                <div className="charges-table-wrap">
                  <table className="charges-table">
                    <thead>
                      <tr>
                        <th>Service Category</th>
                        <th>Estimated Price Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mechanic.serviceCharges).map(([serviceName, chargeRange], idx) => (
                        <tr key={idx}>
                          <td className="charge-service-name">
                            <span className="service-bullet" />
                            {serviceName}
                          </td>
                          <td className="charge-price-range">
                            {chargeRange}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="charges-disclaimer">
                  <Info size={15} />
                  <span>
                    Parts replacement costs and specialized fluids are billed separately based on actual MRP.
                  </span>
                </div>
              </div>
            )}

            {/* Customer Reviews Section */}
            <div className="detail-content-card">
              <div className="card-section-heading reviews-heading">
                <div className="heading-icon-wrap">
                  <Star size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="section-title">Customer Reviews</h3>
                  <p className="section-subtitle">
                    Real feedback from roadside rescue incidents
                  </p>
                </div>
                <div className="overall-score-pill">
                  <Star size={16} className="star-filled" />
                  <span>{mechanic.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              <div className="reviews-list">
                {mechanic.reviews && mechanic.reviews.length > 0 ? (
                  mechanic.reviews.map((rev) => {
                    const revInitials = getInitials(rev.author);
                    return (
                      <div key={rev.id} className="review-card-item">
                        <div className="review-header">
                          <div className="reviewer-avatar">
                            {revInitials}
                          </div>
                          <div className="reviewer-meta">
                            <h4 className="reviewer-name">{rev.author}</h4>
                            <span className="review-date">{formatDate(rev.date)}</span>
                          </div>
                          <div className="review-stars-wrap">
                            {renderStars(rev.rating)}
                          </div>
                        </div>
                        <p className="review-comment">"{rev.comment}"</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-secondary">No customer reviews yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Booking, Availability & Contact Cards */}
          <div className="detail-sidebar-column">
            <div className="sticky-sidebar-container">
              {/* Request Card */}
              <div className="sidebar-action-card request-box">
                <div className="action-card-header">
                  <span className="card-kicker">ON-DEMAND DISPATCH</span>
                  <div className="visit-charge-display">
                    <span className="visit-fee-label">Standard Visit Charge:</span>
                    <div className="fee-big-amount">
                      {formatCurrency(mechanic.visitCharge)}
                    </div>
                  </div>
                  <p className="charge-subnote">
                    Covers technician dispatch, tools & on-site diagnostic inspection.
                  </p>
                </div>

                <div className="action-buttons-group">
                  {mechanic.isAvailable ? (
                    <Link
                      to={`/request-mechanic/${mechanic.id}`}
                      className="btn btn-primary btn-request-large"
                    >
                      <span>Request This Mechanic</span>
                      <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="btn btn-secondary btn-request-large disabled-btn"
                    >
                      Currently Busy with Rescue
                    </button>
                  )}

                  <Link to="/mechanics" className="btn btn-outline btn-back-large">
                    Back to All Mechanics
                  </Link>
                </div>

                <div className="guarantee-box">
                  <CheckCircle2 size={16} className="guarantee-icon" />
                  <span>No upfront payment required until diagnostic is completed</span>
                </div>
              </div>

              {/* Availability & Response Time Card */}
              <div className="sidebar-action-card availability-box">
                <h4 className="action-box-title">Availability & Response</h4>
                
                <div className="info-attribute-list">
                  <div className="attribute-item">
                    <Clock size={16} className="attr-icon" />
                    <div className="attr-content">
                      <span className="attr-label">Response Time</span>
                      <strong className="attr-value">Usually within 20-30 mins</strong>
                    </div>
                  </div>

                  <div className="attribute-item">
                    <Calendar size={16} className="attr-icon" />
                    <div className="attr-content">
                      <span className="attr-label">Working Hours</span>
                      <strong className="attr-value">Mon - Sat, 8:00 AM - 8:00 PM</strong>
                    </div>
                  </div>

                  <div className="attribute-item">
                    <ShieldCheck size={16} className="attr-icon text-success" />
                    <div className="attr-content">
                      <span className="attr-label">Emergency Coverage</span>
                      <strong className="attr-value">24/7 Mobile Quick Response</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="sidebar-action-card contact-box">
                <h4 className="action-box-title">Contact & Location</h4>

                <div className="contact-details-list">
                  <div className="contact-detail-row">
                    <Phone size={16} className="contact-icon" />
                    <div>
                      <span className="contact-label">Phone</span>
                      <div className="contact-val">{mechanic.phone}</div>
                      <span className="demo-notice">(Demo - not a real number)</span>
                    </div>
                  </div>

                  <div className="contact-detail-row">
                    <Mail size={16} className="contact-icon" />
                    <div>
                      <span className="contact-label">Email</span>
                      <div className="contact-val">{mechanic.email}</div>
                      <span className="demo-notice">(Demo)</span>
                    </div>
                  </div>

                  <div className="contact-detail-row">
                    <MapPin size={16} className="contact-icon" />
                    <div>
                      <span className="contact-label">Base Workshop Location</span>
                      <div className="contact-val">{mechanic.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MechanicDetailPage;
