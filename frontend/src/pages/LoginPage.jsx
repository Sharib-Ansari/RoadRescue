import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Zap,
  MapPin,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, DEMO_CREDENTIALS } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear field-specific error as user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) setAuthError('');
  };

  const handleFillDemo = () => {
    const demoEmail = DEMO_CREDENTIALS?.email || 'demo@roadrescue.in';
    const demoPassword = DEMO_CREDENTIALS?.password || 'demo123';
    
    setFormData({
      email: demoEmail,
      password: demoPassword,
      rememberMe: true
    });
    setErrors({});
    setAuthError('');
    setAutoFilled('customer');
    setTimeout(() => setAutoFilled(false), 2500);
  };

  const handleFillMechanicDemo = (e) => {
    if (e) e.stopPropagation();
    const mechEmail = DEMO_CREDENTIALS?.mechanicEmail || 'mechanic@roadrescue.in';
    const mechPassword = DEMO_CREDENTIALS?.mechanicPassword || 'mechanic123';

    setFormData({
      email: mechEmail,
      password: mechPassword,
      rememberMe: true
    });
    setErrors({});
    setAuthError('');
    setAutoFilled('mechanic');
    setTimeout(() => setAutoFilled(false), 2500);
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      // Simulate 800ms authentication delay for realistic feedback
      await new Promise((resolve) => setTimeout(resolve, 800));

      let targetRoute = '/dashboard';
      if (login) {
        const res = await login(formData.email.trim(), formData.password);
        if (res && res.success === false) {
          setAuthError(res.error || 'Invalid email or password.');
          setIsLoading(false);
          return;
        }
        const loggedUser = res?.user || JSON.parse(localStorage.getItem('roadrescue_user') || '{}');
        const role = (loggedUser?.role || loggedUser?.accountType || '').toLowerCase();
        if (role === 'mechanic') {
          targetRoute = '/mechanic/dashboard';
        }
      }

      navigate(targetRoute);
    } catch (err) {
      setAuthError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* =========================================================
          LEFT BRANDING PANEL (50% on Desktop, Hidden on Mobile)
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
            24/7 Roadside Assistance Network
          </div>

          <h2 className="auth-quote-headline">
            &ldquo;When your vehicle stops, help shouldn't.&rdquo;
          </h2>

          <p className="auth-quote-subtext">
            Join thousands of motorists who count on RoadRescue for instantaneous breakdown relief,
            emergency towing, verified spare parts, and certified technician dispatch.
          </p>

          <div className="auth-features-list">
            <div className="auth-feature-row">
              <div className="auth-feat-icon shield">
                <Shield size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Verified Mechanics & Clear Pricing</h4>
                <p>Every technician is certified with transparent upfront rate cards.</p>
              </div>
            </div>

            <div className="auth-feature-row">
              <div className="auth-feat-icon zap">
                <Zap size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Under 15-Minute Response Time</h4>
                <p>Rapid dispatch system connects you to the closest active mechanic.</p>
              </div>
            </div>

            <div className="auth-feature-row">
              <div className="auth-feat-icon pin">
                <MapPin size={20} />
              </div>
              <div className="auth-feat-content">
                <h4>Real-Time GPS Location & Tracking</h4>
                <p>Watch your assigned technician arrive in real-time on live maps.</p>
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
            Trusted by <strong>10,000+ vehicle owners</strong> and 500+ service partners across India.
          </p>
        </div>
      </div>

      {/* =========================================================
          RIGHT AUTH FORM PANEL
         ========================================================= */}
      <div className="auth-right-panel">
        <div className="auth-form-card">
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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your RoadRescue account</p>
          </div>

          {/* DEMO CREDENTIALS BANNER (PROMINENT - YELLOW/AMBER BACKGROUND) */}
          <div
            className={`demo-credentials-banner ${autoFilled ? 'flash-success' : ''}`}
            title="Click to auto-fill demo accounts"
          >
            <div className="demo-banner-header">
              <div className="demo-badge-title">
                <KeyRound size={16} className="demo-key-icon" />
                <span>Demo Accounts</span>
              </div>
              <span className="demo-click-hint">
                {autoFilled ? (
                  <span className="filled-notice">
                    <CheckCircle2 size={13} /> {autoFilled === 'mechanic' ? 'Mechanic' : 'Customer'} Applied!
                  </span>
                ) : (
                  'Click an account to auto-fill'
                )}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              <div
                onClick={handleFillDemo}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem'
                }}
              >
                <span>👤 <strong>Customer:</strong> demo@roadrescue.in</span>
                <span style={{ color: 'var(--text-muted)' }}>demo123</span>
              </div>

              <div
                onClick={handleFillMechanicDemo}
                style={{
                  padding: '0.4rem 0.6rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem'
                }}
              >
                <span>🔧 <strong>Mechanic Partner:</strong> mechanic@roadrescue.in</span>
                <span style={{ color: 'var(--text-muted)' }}>mechanic123</span>
              </div>
            </div>
          </div>

          {/* Global Auth Error Alert */}
          {authError && (
            <div className="auth-alert-error">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} noValidate className="auth-main-form">
            {/* Email Field */}
            <div className="auth-field-group">
              <label htmlFor="login-email" className="auth-label">
                Email Address
              </label>
              <div className={`auth-input-wrapper ${errors.email ? 'input-error' : ''}`}>
                <Mail size={18} className="field-icon" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  className="auth-input"
                  autoComplete="email"
                  required
                />
              </div>
              {errors.email && <span className="auth-inline-error">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="auth-field-group">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link dispatched to your email address.');
                  }}
                  className="auth-forgot-link"
                >
                  Forgot password?
                </a>
              </div>
              <div className={`auth-input-wrapper ${errors.password ? 'input-error' : ''}`}>
                <Lock size={18} className="field-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="auth-input"
                  autoComplete="current-password"
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

            {/* Remember Me Checkbox */}
            <div className="auth-checkbox-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom" />
                <span className="checkbox-label">Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`auth-submit-btn ${isLoading ? 'btn-loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
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
              Don&apos;t have an account?{' '}
              <Link to="/register" className="auth-switch-link">
                Create one now
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
