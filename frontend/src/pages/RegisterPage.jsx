import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Car,
  Shield,
  Zap,
  MapPin,
  ArrowRight,
  AlertCircle,
  Star,
  CheckCircle2,
  Store,
  ShoppingBag,
  Navigation,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer', // 'customer', 'mechanic', or 'shop_owner'
    agreeTerms: false,
    // Mechanic-specific fields
    workshopName: '',
    servicesOffered: ['Engine Repair', 'Tyre Service'],
    experienceYears: '',
    serviceArea: '',
    // Spare Parts Shop fields
    shopName: '',
    shopAddress: '',
    shopCity: '',
    shopPinCode: '',
    shopDescription: '',
    shopPhone: '',
    shopLatitude: '',
    shopLongitude: '',
    acceptsHomeDelivery: true,
    acceptsShopPickup: true,
    deliveryCharge: 50
  });

  const [isLocating, setIsLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, location: 'Geolocation is not supported by your browser' }));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          shopLatitude: pos.coords.latitude.toFixed(6),
          shopLongitude: pos.coords.longitude.toFixed(6)
        }));
        setIsLocating(false);
        setErrors((prev) => ({ ...prev, location: '' }));
      },
      (err) => {
        setIsLocating(false);
        setErrors((prev) => ({
          ...prev,
          location: 'Location access was denied or timed out. Please enter your shop GPS coordinates manually.'
        }));
      },
      { timeout: 8000 }
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear specific field error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError('');
  };

  const handleServiceToggle = (service) => {
    setFormData((prev) => {
      const current = prev.servicesOffered || [];
      const updated = current.includes(service)
        ? current.filter((s) => s !== service)
        : [...current, service];
      return { ...prev, servicesOffered: updated };
    });
    if (errors.servicesOffered) {
      setErrors((prev) => ({ ...prev, servicesOffered: '' }));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Full name check
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email check
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Indian Phone format validation: 10 digits starting with 6-9 (handles optional +91 prefix)
    const cleanPhone = formData.phone.replace(/\D/g, '').replace(/^91/, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
    }

    // Password requirements: min 6 chars
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password match
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Mechanic specific validation
    if (formData.role === 'mechanic') {
      if (!formData.workshopName.trim()) {
        newErrors.workshopName = 'Workshop or business name is required';
      }
      if (!formData.experienceYears || Number(formData.experienceYears) < 0) {
        newErrors.experienceYears = 'Valid years of experience is required';
      }
      if (!formData.serviceArea.trim()) {
        newErrors.serviceArea = 'Primary service area/city is required';
      }
      if (!formData.servicesOffered || formData.servicesOffered.length === 0) {
        newErrors.servicesOffered = 'Select at least one service offered';
      }
    }

    // Spare Parts Shop specific validation
    if (formData.role === 'shop_owner') {
      if (!formData.shopName.trim()) {
        newErrors.shopName = 'Shop name is required';
      }
      if (!formData.shopAddress.trim()) {
        newErrors.shopAddress = 'Physical shop address is required';
      }
      if (!formData.shopCity.trim()) {
        newErrors.shopCity = 'City is required';
      }
      if (!formData.shopPinCode.trim()) {
        newErrors.shopPinCode = 'PIN code is required';
      } else if (!/^\d{6}$/.test(formData.shopPinCode.trim())) {
        newErrors.shopPinCode = 'Enter a valid 6-digit Indian PIN code';
      }
      if (!formData.acceptsHomeDelivery && !formData.acceptsShopPickup) {
        newErrors.fulfillment = 'Shop must offer at least one fulfillment method';
      }
      if (formData.acceptsHomeDelivery && (formData.deliveryCharge === '' || Number(formData.deliveryCharge) < 0)) {
        newErrors.deliveryCharge = 'Delivery charge must be ₹0 or greater';
      }
      if (formData.shopLatitude === '' || formData.shopLongitude === '') {
        newErrors.location = 'Shop location coordinates are required';
      }
    }

    // Terms agreement
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the Terms of Service & Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setAuthError('');

    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 600));

      const payload = {
        name: formData.fullName,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        accountType: formData.role,
        role: formData.role,
        // Mechanic fields
        workshopName: formData.workshopName,
        servicesOffered: formData.servicesOffered,
        experienceYears: formData.experienceYears,
        serviceArea: formData.serviceArea,
        // Shop fields
        shopName: formData.shopName,
        shopAddress: formData.shopAddress,
        shopCity: formData.shopCity,
        shopPinCode: formData.shopPinCode,
        shopDescription: formData.shopDescription,
        shopPhone: formData.shopPhone || formData.phone,
        latitude: formData.shopLatitude !== '' ? Number(formData.shopLatitude) : undefined,
        longitude: formData.shopLongitude !== '' ? Number(formData.shopLongitude) : undefined,
        acceptsHomeDelivery: formData.acceptsHomeDelivery,
        acceptsShopPickup: formData.acceptsShopPickup,
        deliveryCharge: Number(formData.deliveryCharge) || 0
      };

      if (register) {
        const res = await register(payload);
        if (res && res.success === false) {
          setAuthError(res.error || 'Failed to create account. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      // Role-based navigation
      if (formData.role === 'mechanic') {
        navigate('/mechanic/dashboard');
      } else if (formData.role === 'shop_owner') {
        navigate('/shop/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* =========================================================
          LEFT BRANDING PANEL (Hidden on Mobile)
         ========================================================= */}
      <div className="auth-left-panel">
        <div className="auth-brand-glow" />

        <div className="auth-left-header">
          <Link to="/" className="auth-brand-logo">
            <div className="auth-logo-icon-wrap">
              <Wrench size={22} className="auth-logo-icon" />
            </div>
            <span className="auth-logo-text">
              Road<span className="auth-logo-highlight">Rescue</span>
            </span>
          </Link>
        </div>

        <div className="auth-left-body">
          <div className="auth-quote-badge">
            <span className="quote-pulse" />
            Quick & Simple Registration
          </div>

          <h2 className="auth-quote-headline">
            &ldquo;Never get stranded alone on the highway again.&rdquo;
          </h2>

          <p className="auth-quote-subtext">
            Join RoadRescue today to request instant on-demand roadside assistance, connect with certified mechanics,
            or join our network as an automotive service partner.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-row">
              <div className="auth-feat-icon shield">
                <Shield size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Verified Service Ecosystem</h4>
                <p>Every mechanic and towing partner is vetted and background checked.</p>
              </div>
            </div>

            <div className="auth-feature-row">
              <div className="auth-feat-icon zap">
                <Zap size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Rapid 2-Minute Request</h4>
                <p>One-tap SOS dispatch ensures help arrives as fast as possible.</p>
              </div>
            </div>

            <div className="auth-feature-row">
              <div className="auth-feat-icon pin">
                <MapPin size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Nationwide Coverage</h4>
                <p>Connecting motorists and local garages in over 50+ cities across India.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="trust-stars-row">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} fill="#F59E0B" color="#F59E0B" />
            ))}
          </div>
          <p className="auth-trust-label">
            Trusted by <strong>10,000+ vehicle owners</strong> and 500+ mechanics across India.
          </p>
        </div>
      </div>

      {/* =========================================================
          RIGHT REGISTRATION FORM PANEL
         ========================================================= */}
      <div className="auth-right-panel register-panel">
        <div className="auth-form-card register-card">
          {/* Mobile Back Link & Brand Logo */}
          <div className="mobile-only-header">
            <Link to="/" className="auth-brand-logo">
              <div className="auth-logo-icon-wrap">
                <Wrench size={20} className="auth-logo-icon" />
              </div>
              <span className="auth-logo-text">
                Road<span className="auth-logo-highlight">Rescue</span>
              </span>
            </Link>
          </div>

          <div className="auth-form-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join RoadRescue for smart roadside emergency support</p>
          </div>

          {/* Global Auth Error Alert */}
          {authError && (
            <div className="auth-alert-error">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="auth-main-form">
            {/* -----------------------------------------------------
                SECTION 3: ACCOUNT TYPE (Styled Radio Cards)
               ----------------------------------------------------- */}
            <div className="auth-section-group">
              <label className="auth-label">I want to register as:</label>
              <div className="account-type-grid">
                <div
                  className={`account-type-card ${formData.role === 'customer' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('customer')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRoleSelect('customer');
                  }}
                >
                  <div className="account-card-header">
                    <div className="type-icon-box car">
                      <Car size={22} />
                    </div>
                    {formData.role === 'customer' && <CheckCircle2 size={18} className="selected-check" />}
                  </div>
                  <div className="type-info">
                    <h4>Customer</h4>
                    <p>I need vehicle assistance & towing</p>
                  </div>
                </div>

                <div
                  className={`account-type-card ${formData.role === 'mechanic' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('mechanic')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRoleSelect('mechanic');
                  }}
                >
                  <div className="account-card-header">
                    <div className="type-icon-box wrench">
                      <Wrench size={22} />
                    </div>
                    {formData.role === 'mechanic' && <CheckCircle2 size={18} className="selected-check" />}
                  </div>
                  <div className="type-info">
                    <h4>Mechanic</h4>
                    <p>I provide repair & towing services</p>
                  </div>
                </div>

                <div
                  className={`account-type-card ${formData.role === 'shop_owner' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('shop_owner')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRoleSelect('shop_owner');
                  }}
                >
                  <div className="account-card-header">
                    <div className="type-icon-box wrench" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
                      <Store size={22} />
                    </div>
                    {formData.role === 'shop_owner' && <CheckCircle2 size={18} className="selected-check" />}
                  </div>
                  <div className="type-info">
                    <h4>Spare Parts Shop</h4>
                    <p>I sell auto parts & accessories</p>
                  </div>
                </div>
              </div>
            </div>

            {/* -----------------------------------------------------
                SECTION 1: PERSONAL INFO
               ----------------------------------------------------- */}
            <div className="auth-section-title">
              <span>Personal Information</span>
            </div>

            {/* Full Name */}
            <div className="auth-field-group">
              <label htmlFor="reg-fullname" className="auth-label">
                Full Name
              </label>
              <div className={`auth-input-wrapper ${errors.fullName ? 'input-error' : ''}`}>
                <User size={18} className="field-icon" />
                <input
                  id="reg-fullname"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Rahul Verma"
                  className="auth-input"
                  required
                />
              </div>
              {errors.fullName && <span className="auth-inline-error">{errors.fullName}</span>}
            </div>

            {/* Email */}
            <div className="auth-field-group">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className={`auth-input-wrapper ${errors.email ? 'input-error' : ''}`}>
                <Mail size={18} className="field-icon" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="rahul@example.com"
                  className="auth-input"
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <span className="auth-inline-error">{errors.email}</span>}
            </div>

            {/* Phone Number */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label htmlFor="reg-phone" className="auth-label">
                  Phone Number
                </label>
                <span className="auth-hint-text">Format: 10-digit Indian mobile</span>
              </div>
              <div className={`auth-input-wrapper ${errors.phone ? 'input-error' : ''}`}>
                <Phone size={18} className="field-icon" />
                <input
                  id="reg-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className="auth-input"
                  autoComplete="tel"
                  required
                />
              </div>
              {errors.phone && <span className="auth-inline-error">{errors.phone}</span>}
            </div>

            {/* -----------------------------------------------------
                SECTION 1.5: MECHANIC WORKSHOP DETAILS (Only if role === 'mechanic')
               ----------------------------------------------------- */}
            {formData.role === 'mechanic' && (
              <>
                <div className="auth-section-title">
                  <span>Workshop & Business Details</span>
                </div>

                {/* Workshop Name */}
                <div className="auth-field-group">
                  <label htmlFor="reg-workshop" className="auth-label">
                    Workshop / Business Name
                  </label>
                  <div className={`auth-input-wrapper ${errors.workshopName ? 'input-error' : ''}`}>
                    <Wrench size={18} className="field-icon" />
                    <input
                      id="reg-workshop"
                      type="text"
                      name="workshopName"
                      value={formData.workshopName}
                      onChange={handleInputChange}
                      placeholder="e.g. Apex Auto Care & Recovery"
                      className="auth-input"
                      required
                    />
                  </div>
                  {errors.workshopName && <span className="auth-inline-error">{errors.workshopName}</span>}
                </div>

                {/* Experience & Service Area Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="auth-field-group">
                    <label htmlFor="reg-exp" className="auth-label">
                      Years of Experience
                    </label>
                    <div className={`auth-input-wrapper ${errors.experienceYears ? 'input-error' : ''}`}>
                      <input
                        id="reg-exp"
                        type="number"
                        name="experienceYears"
                        min="0"
                        max="50"
                        value={formData.experienceYears}
                        onChange={handleInputChange}
                        placeholder="e.g. 8"
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                        required
                      />
                    </div>
                    {errors.experienceYears && <span className="auth-inline-error">{errors.experienceYears}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="reg-area" className="auth-label">
                      Primary Service Area / City
                    </label>
                    <div className={`auth-input-wrapper ${errors.serviceArea ? 'input-error' : ''}`}>
                      <MapPin size={18} className="field-icon" />
                      <input
                        id="reg-area"
                        type="text"
                        name="serviceArea"
                        value={formData.serviceArea}
                        onChange={handleInputChange}
                        placeholder="e.g. South Delhi / Gurgaon"
                        className="auth-input"
                        required
                      />
                    </div>
                    {errors.serviceArea && <span className="auth-inline-error">{errors.serviceArea}</span>}
                  </div>
                </div>

                {/* Services Offered Selection */}
                <div className="auth-field-group">
                  <label className="auth-label">Services Offered (Select all that apply)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {[
                      'Engine Repair',
                      'Tyre Service',
                      'Battery Jumpstart',
                      'Brake Service',
                      'Vehicle Towing',
                      'Electrical Diagnostics',
                      'Fuel Delivery',
                      'Clutch & Transmission'
                    ].map((service) => {
                      const isSelected = formData.servicesOffered?.includes(service);
                      return (
                        <div
                          key={service}
                          onClick={() => handleServiceToggle(service)}
                          style={{
                            padding: '0.5rem 0.65rem',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--accent-primary, #EF4444)' : 'var(--border-color, #303641)'}`,
                            backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-input, #151820)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-secondary, #9CA3AF)',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 600 : 400,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '4px',
                              border: `1px solid ${isSelected ? '#EF4444' : '#6B7280'}`,
                              backgroundColor: isSelected ? '#EF4444' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '10px'
                            }}
                          >
                            {isSelected && '✓'}
                          </div>
                          <span>{service}</span>
                        </div>
                      );
                    })}
                  </div>
                  {errors.servicesOffered && <span className="auth-inline-error">{errors.servicesOffered}</span>}
                </div>
              </>
            )}

            {/* -----------------------------------------------------
                SPARE PARTS SHOP DETAILS (Conditional)
               ----------------------------------------------------- */}
            {formData.role === 'shop_owner' && (
              <>
                <div className="auth-section-title">
                  <span>Spare Parts Shop Details</span>
                </div>

                {/* Shop Name */}
                <div className="auth-field-group">
                  <label htmlFor="reg-shop-name" className="auth-label">
                    Shop / Store Name
                  </label>
                  <div className={`auth-input-wrapper ${errors.shopName ? 'input-error' : ''}`}>
                    <Store size={18} className="field-icon" />
                    <input
                      id="reg-shop-name"
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleInputChange}
                      placeholder="e.g. Metro Auto Spares & Accessories"
                      className="auth-input"
                      required
                    />
                  </div>
                  {errors.shopName && <span className="auth-inline-error">{errors.shopName}</span>}
                </div>

                {/* Shop Description */}
                <div className="auth-field-group">
                  <label htmlFor="reg-shop-desc" className="auth-label">
                    Shop Description (Optional)
                  </label>
                  <div className="auth-input-wrapper">
                    <input
                      id="reg-shop-desc"
                      type="text"
                      name="shopDescription"
                      value={formData.shopDescription}
                      onChange={handleInputChange}
                      placeholder="e.g. Genuine OEM & aftermarket parts for multi-brand cars"
                      className="auth-input"
                      style={{ paddingLeft: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Physical Address */}
                <div className="auth-field-group">
                  <label htmlFor="reg-shop-addr" className="auth-label">
                    Shop Physical Address / Street
                  </label>
                  <div className={`auth-input-wrapper ${errors.shopAddress ? 'input-error' : ''}`}>
                    <MapPin size={18} className="field-icon" />
                    <input
                      id="reg-shop-addr"
                      type="text"
                      name="shopAddress"
                      value={formData.shopAddress}
                      onChange={handleInputChange}
                      placeholder="e.g. Shop 14, Auto Market, Mayapuri"
                      className="auth-input"
                      required
                    />
                  </div>
                  {errors.shopAddress && <span className="auth-inline-error">{errors.shopAddress}</span>}
                </div>

                {/* City & PIN Code */}
                <div className="auth-row-2col">
                  <div className="auth-field-group">
                    <label htmlFor="reg-shop-city" className="auth-label">
                      City
                    </label>
                    <div className={`auth-input-wrapper ${errors.shopCity ? 'input-error' : ''}`}>
                      <input
                        id="reg-shop-city"
                        type="text"
                        name="shopCity"
                        value={formData.shopCity}
                        onChange={handleInputChange}
                        placeholder="e.g. New Delhi"
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                        required
                      />
                    </div>
                    {errors.shopCity && <span className="auth-inline-error">{errors.shopCity}</span>}
                  </div>

                  <div className="auth-field-group">
                    <label htmlFor="reg-shop-pin" className="auth-label">
                      PIN Code (6 digits)
                    </label>
                    <div className={`auth-input-wrapper ${errors.shopPinCode ? 'input-error' : ''}`}>
                      <input
                        id="reg-shop-pin"
                        type="text"
                        name="shopPinCode"
                        value={formData.shopPinCode}
                        onChange={handleInputChange}
                        placeholder="110064"
                        maxLength={6}
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                        required
                      />
                    </div>
                    {errors.shopPinCode && <span className="auth-inline-error">{errors.shopPinCode}</span>}
                  </div>
                </div>

                {/* Fulfillment Methods */}
                <div className="auth-field-group">
                  <label className="auth-label">Fulfillment Methods Offered</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
                    <label
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: `1px solid ${formData.acceptsHomeDelivery ? 'var(--accent-primary, #EF4444)' : 'var(--border-color, #303641)'}`,
                        backgroundColor: formData.acceptsHomeDelivery ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input, #151820)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: formData.acceptsHomeDelivery ? '#fff' : 'var(--text-secondary, #9CA3AF)'
                      }}
                    >
                      <input
                        type="checkbox"
                        name="acceptsHomeDelivery"
                        checked={formData.acceptsHomeDelivery}
                        onChange={handleInputChange}
                        style={{ accentColor: '#EF4444' }}
                      />
                      <Truck size={16} />
                      <span>Home Delivery</span>
                    </label>

                    <label
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: `1px solid ${formData.acceptsShopPickup ? 'var(--accent-primary, #EF4444)' : 'var(--border-color, #303641)'}`,
                        backgroundColor: formData.acceptsShopPickup ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-input, #151820)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.82rem',
                        color: formData.acceptsShopPickup ? '#fff' : 'var(--text-secondary, #9CA3AF)'
                      }}
                    >
                      <input
                        type="checkbox"
                        name="acceptsShopPickup"
                        checked={formData.acceptsShopPickup}
                        onChange={handleInputChange}
                        style={{ accentColor: '#EF4444' }}
                      />
                      <Store size={16} />
                      <span>Shop Pickup</span>
                    </label>
                  </div>
                  {errors.fulfillment && <span className="auth-inline-error">{errors.fulfillment}</span>}
                </div>

                {/* Delivery Charge (if Home Delivery selected) */}
                {formData.acceptsHomeDelivery && (
                  <div className="auth-field-group">
                    <label htmlFor="reg-deliv-charge" className="auth-label">
                      Standard Delivery Fee (₹)
                    </label>
                    <div className={`auth-input-wrapper ${errors.deliveryCharge ? 'input-error' : ''}`}>
                      <input
                        id="reg-deliv-charge"
                        type="number"
                        min="0"
                        name="deliveryCharge"
                        value={formData.deliveryCharge}
                        onChange={handleInputChange}
                        placeholder="50"
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                    {errors.deliveryCharge && <span className="auth-inline-error">{errors.deliveryCharge}</span>}
                  </div>
                )}

                {/* Location Coordinates & Auto-detection */}
                <div className="auth-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="auth-label">Shop GPS Location</label>
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--accent-primary, #EF4444)',
                        color: 'var(--accent-primary, #EF4444)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Navigation size={13} />
                      {isLocating ? 'Detecting...' : 'Detect GPS'}
                    </button>
                  </div>
                  <div className="auth-row-2col" style={{ marginTop: '0.35rem' }}>
                    <div className="auth-input-wrapper">
                      <input
                        type="text"
                        name="shopLatitude"
                        value={formData.shopLatitude}
                        onChange={handleInputChange}
                        placeholder="Latitude"
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                    <div className="auth-input-wrapper">
                      <input
                        type="text"
                        name="shopLongitude"
                        value={formData.shopLongitude}
                        onChange={handleInputChange}
                        placeholder="Longitude"
                        className="auth-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                  </div>
                  {errors.location && <span className="auth-inline-error">{errors.location}</span>}
                </div>
              </>
            )}

            {/* -----------------------------------------------------
                SECTION 2: ACCOUNT SECURITY
               ----------------------------------------------------- */}
            <div className="auth-section-title">
              <span>Account Security</span>
            </div>

            {/* Password */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label htmlFor="reg-password" className="auth-label">
                  Password
                </label>
                <span className="auth-hint-text">Minimum 6 characters</span>
              </div>
              <div className={`auth-input-wrapper ${errors.password ? 'input-error' : ''}`}>
                <Lock size={18} className="field-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="auth-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pwd-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="auth-inline-error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="auth-field-group">
              <label htmlFor="reg-confirmpassword" className="auth-label">
                Confirm Password
              </label>
              <div className={`auth-input-wrapper ${errors.confirmPassword ? 'input-error' : ''}`}>
                <Lock size={18} className="field-icon" />
                <input
                  id="reg-confirmpassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="auth-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pwd-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="auth-inline-error">{errors.confirmPassword}</span>}
            </div>

            {/* -----------------------------------------------------
                SECTION 4: TERMS CHECKBOX
               ----------------------------------------------------- */}
            <div className="auth-checkbox-row terms-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label">
                  I agree to the <a href="#terms" className="terms-link">Terms of Service</a> and{' '}
                  <a href="#privacy" className="terms-link">Privacy Policy</a>
                </span>
              </label>
            </div>
            {errors.agreeTerms && <span className="auth-inline-error terms-error">{errors.agreeTerms}</span>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`auth-submit-btn ${isLoading ? 'btn-loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line" />
            <span className="divider-text">or</span>
            <span className="divider-line" />
          </div>

          {/* Footer Navigation */}
          <div className="auth-bottom-nav">
            <p className="auth-switch-text">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Sign in here
              </Link>
            </p>
            <div className="auth-home-back">
              <Link to="/" className="back-home-link">
                ← Return to RoadRescue Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
