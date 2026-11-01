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
  CheckCircle2
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
    role: 'customer', // 'customer' or 'mechanic'
    agreeTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (register) {
        await register({
          name: formData.fullName,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          accountType: formData.role,
          role: formData.role
        });
      } else {
        localStorage.setItem(
          'roadrescue_user',
          JSON.stringify({
            id: 'usr_' + Date.now(),
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            accountType: formData.role
          })
        );
      }

      navigate('/dashboard');
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
                    <h4>Mechanic / Shop</h4>
                    <p>I provide repair services & parts</p>
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
