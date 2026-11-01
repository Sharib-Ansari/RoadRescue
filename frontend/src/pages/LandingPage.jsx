import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Package,
  Truck,
  AlertTriangle,
  MapPin,
  Search,
  CheckCircle,
  Check,
  Menu,
  X,
  ArrowRight,
  Phone,
  Mail,
  Github,
  Twitter,
  Linkedin,
  Star,
  Clock,
  Shield,
  Sparkles
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - navHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="landing-page">
      {/* =========================================================
          A. NAVBAR
         ========================================================= */}
      <nav className={`landing-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo" onClick={(e) => handleNavClick(e, 'home')}>
            <div className="logo-icon-wrap">
              <Wrench className="logo-icon" size={24} />
            </div>
            <span className="logo-text">
              Road<span className="logo-highlight">Rescue</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="landing-nav-links">
            <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="nav-link">
              Home
            </a>
            <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="nav-link">
              Services
            </a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="nav-link">
              How It Works
            </a>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="nav-link">
              About
            </a>
          </div>

          {/* Auth CTA Buttons */}
          <div className="landing-nav-cta">
            <Link to="/login" className="btn-nav-outline">
              Login
            </Link>
            <Link to="/register" className="btn-nav-primary">
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="mobile-dropdown-menu">
            <a href="#home" onClick={(e) => handleNavClick(e, 'home')} className="mobile-nav-link">
              Home
            </a>
            <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="mobile-nav-link">
              Services
            </a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')} className="mobile-nav-link">
              How It Works
            </a>
            <a href="#about" onClick={(e) => handleNavClick(e, 'about')} className="mobile-nav-link">
              About
            </a>
            <div className="mobile-nav-actions">
              <Link to="/login" className="btn-nav-outline mobile-btn" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn-nav-primary mobile-btn" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* =========================================================
          B. HERO SECTION
         ========================================================= */}
      <section className="hero-section" id="home">
        {/* Subtle geometric pattern & gradient ambient orbs */}
        <div className="hero-glow hero-glow-red" />
        <div className="hero-glow hero-glow-blue" />
        <div className="hero-grid-pattern" />

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-pulse" />
              <Sparkles size={14} className="hero-badge-icon" />
              <span>Smart On-Demand Roadside Assistance</span>
            </div>

            <h1 className="hero-title">
              Vehicle Trouble?
              <span className="hero-title-accent">Help Is On The Way.</span>
            </h1>

            <p className="hero-subtext">
              Get connected with nearby mechanics, find essential spare parts, and access reliable
              roadside assistance whenever your vehicle breaks down.
            </p>

            <div className="hero-cta-group">
              <Link to="/register" className="hero-btn-primary">
                <span>Get Emergency Help</span>
                <ArrowRight size={18} />
              </Link>
              <a href="#services" onClick={(e) => handleNavClick(e, 'services')} className="hero-btn-outline">
                Explore Services
              </a>
            </div>

            {/* Stats Row */}
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Mechanics</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat-item">
                <span className="stat-number">50+</span>
                <span className="stat-label">Cities</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat-item">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Requests Served</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>
          </div>

          {/* Right Visual: Active Request Simulation Card */}
          <div className="hero-visual">
            <div className="simulation-card-wrapper">
              <div className="simulation-card">
                <div className="sim-header">
                  <div className="sim-status-chip">
                    <span className="pulse-dot" />
                    <span>ACTIVE REQUEST #RR-8924</span>
                  </div>
                  <span className="sim-time">Live Dispatch</span>
                </div>

                <div className="sim-route-visual">
                  <div className="sim-map-mock">
                    <div className="map-road map-road-main" />
                    <div className="map-road map-road-cross" />
                    
                    <div className="map-marker-pin user-pin">
                      <div className="pin-pulse" />
                      <div className="pin-icon">🚗</div>
                      <span className="pin-label">You (NH-48)</span>
                    </div>

                    <div className="map-marker-pin mechanic-pin">
                      <div className="pin-icon">🛠️</div>
                      <span className="pin-label">Mechanic</span>
                    </div>

                    <div className="route-line-animated" />
                  </div>
                </div>

                <div className="sim-details">
                  <div className="sim-mechanic-profile">
                    <div className="mechanic-avatar">
                      <span>VS</span>
                      <div className="avatar-online-badge" />
                    </div>
                    <div className="mechanic-info">
                      <div className="mech-name-row">
                        <h4>Vikram Sharma</h4>
                        <span className="mech-badge">Verified Pro</span>
                      </div>
                      <p className="mech-vehicle">Hero Towing & Quick Repair Service</p>
                      <div className="mech-rating">
                        <Star size={14} className="star-icon" fill="#F59E0B" color="#F59E0B" />
                        <span className="rating-num">4.9</span>
                        <span className="rating-count">(184 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="sim-eta-box">
                    <div className="eta-item">
                      <Clock size={16} className="eta-icon" />
                      <div>
                        <span className="eta-title">Estimated Arrival</span>
                        <span className="eta-val">12 mins away (3.2 km)</span>
                      </div>
                    </div>
                    <div className="eta-status-pill">
                      <span>Mechanic En Route</span>
                    </div>
                  </div>

                  <div className="sim-steps-progress">
                    <div className="prog-step done">
                      <div className="step-dot" />
                      <span>Request Sent</span>
                    </div>
                    <div className="prog-line done" />
                    <div className="prog-step done">
                      <div className="step-dot" />
                      <span>Accepted</span>
                    </div>
                    <div className="prog-line in-progress" />
                    <div className="prog-step active">
                      <div className="step-dot" />
                      <span>Arriving</span>
                    </div>
                    <div className="prog-line" />
                    <div className="prog-step">
                      <div className="step-dot" />
                      <span>Repaired</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating quick alert badge */}
              <div className="hero-floating-pill">
                <Shield size={18} className="pill-icon text-success" />
                <div>
                  <strong>Mechanic Dispatched</strong>
                  <p>Guaranteed fast response time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          C. SERVICES SECTION
         ========================================================= */}
      <section className="services-section" id="services">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Comprehensive Solutions</span>
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Everything you need when you&apos;re stranded
            </p>
          </div>

          <div className="services-grid">
            {/* Card 1: Find Nearby Mechanics */}
            <div className="service-card">
              <div className="service-icon-box icon-blue">
                <Wrench size={28} />
              </div>
              <h3 className="service-title">Find Nearby Mechanics</h3>
              <p className="service-desc">
                Locate certified mechanics near you instantly with real-time GPS tracking and instant dispatch.
              </p>
              <Link to="/register" className="service-link">
                <span>Learn More →</span>
              </Link>
            </div>

            {/* Card 2: Spare Parts Assistance */}
            <div className="service-card">
              <div className="service-icon-box icon-yellow">
                <Package size={28} />
              </div>
              <h3 className="service-title">Spare Parts Assistance</h3>
              <p className="service-desc">
                Find the exact parts you need at the best prices delivered directly to your breakdown spot.
              </p>
              <Link to="/register" className="service-link">
                <span>Learn More →</span>
              </Link>
            </div>

            {/* Card 3: Vehicle Towing */}
            <div className="service-card">
              <div className="service-icon-box icon-red">
                <Truck size={28} />
              </div>
              <h3 className="service-title">Vehicle Towing</h3>
              <p className="service-desc">
                Safe and reliable towing service to nearest workshop or preferred service center with upfront flat rates.
              </p>
              <Link to="/register" className="service-link">
                <span>Learn More →</span>
              </Link>
            </div>

            {/* Card 4: Emergency Roadside Support */}
            <div className="service-card">
              <div className="service-icon-box icon-green">
                <AlertTriangle size={28} />
              </div>
              <h3 className="service-title">Emergency Roadside Support</h3>
              <p className="service-desc">
                24/7 emergency support for all vehicle types including puncture repair, fuel delivery, and jumpstarts.
              </p>
              <Link to="/register" className="service-link">
                <span>Learn More →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          D. HOW IT WORKS SECTION
         ========================================================= */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="landing-container">
          <div className="section-header">
            <span className="section-badge">Simple & Seamless</span>
            <h2 className="section-title">How RoadRescue Works</h2>
            <p className="section-subtitle">
              Get back on the road in minutes with our 3-step streamlined assistance flow.
            </p>
          </div>

          <div className="steps-wrapper">
            <div className="steps-connector-line" />

            <div className="step-card">
              <div className="step-number-tag">01</div>
              <div className="step-icon-wrap">
                <MapPin size={32} />
              </div>
              <h3 className="step-title">Share Your Location</h3>
              <p className="step-desc">
                Enable location or enter your address manually to pinpoint your vehicle on our real-time radar.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-tag">02</div>
              <div className="step-icon-wrap">
                <Search size={32} />
              </div>
              <h3 className="step-title">Find Nearby Assistance</h3>
              <p className="step-desc">
                Browse available mechanics and services in your area with transparent pricing and live status.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number-tag">03</div>
              <div className="step-icon-wrap">
                <CheckCircle size={32} />
              </div>
              <h3 className="step-title">Get Back On The Road</h3>
              <p className="step-desc">
                Confirm your request and get help within minutes from a verified technician.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          E. WHY CHOOSE ROADRESCUE (ABOUT)
         ========================================================= */}
      <section className="about-section" id="about">
        <div className="landing-container">
          <div className="about-split-grid">
            <div className="about-left">
              <span className="section-badge">Fast & Dependable</span>
              <h2 className="about-heading">Why Choose RoadRescue?</h2>
              <p className="about-description">
                When an unexpected mechanical failure happens, you shouldn&apos;t have to guess who to call or worry
                about exorbitant repair rates. RoadRescue creates a connected safety net for motorists nationwide.
              </p>
              
              <div className="about-trust-box">
                <div className="trust-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p className="trust-stat-text">
                  <strong>Trusted by 10,000+ vehicle owners across India</strong> for reliable highway and city roadside rescue.
                </p>
              </div>

              <div className="about-metrics">
                <div className="about-metric-cell">
                  <span className="metric-val">15 min</span>
                  <span className="metric-lbl">Avg Response Time</span>
                </div>
                <div className="about-metric-cell">
                  <span className="metric-val">98.4%</span>
                  <span className="metric-lbl">Resolution Rate</span>
                </div>
              </div>
            </div>

            <div className="about-right">
              <div className="features-list">
                <div className="feature-item">
                  <div className="feature-check-icon">
                    <Check size={20} />
                  </div>
                  <div className="feature-text">
                    <h4>Location-Based Assistance</h4>
                    <p>GPS-powered mechanic discovery connects you instantly with the nearest available garage.</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-check-icon">
                    <Check size={20} />
                  </div>
                  <div className="feature-text">
                    <h4>Easy Mechanic Discovery</h4>
                    <p>Browse profiles, ratings, and reviews from real vehicle owners before confirming assistance.</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-check-icon">
                    <Check size={20} />
                  </div>
                  <div className="feature-text">
                    <h4>Transparent Service Info</h4>
                    <p>Clear pricing, no hidden charges, and standardized inspection fees upfront.</p>
                  </div>
                </div>

                <div className="feature-item">
                  <div className="feature-check-icon">
                    <Check size={20} />
                  </div>
                  <div className="feature-text">
                    <h4>Convenient Roadside Support</h4>
                    <p>Request help in under 2 minutes with live technician status and ETA tracking.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          F. CTA BANNER
         ========================================================= */}
      <section className="cta-banner-section">
        <div className="cta-banner-container">
          <div className="cta-banner-card">
            <div className="cta-glow-element" />
            <div className="cta-content">
              <h2 className="cta-title">Ready to Hit the Road Worry-Free?</h2>
              <p className="cta-subtitle">
                Download the app or use our web platform whenever you need roadside assistance.
              </p>
              <div className="cta-btn-wrap">
                <Link to="/register" className="btn-cta-white">
                  <span>Get Started Today</span>
                  <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="btn-cta-transparent">
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          G. FOOTER
         ========================================================= */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-columns-grid">
            {/* Column 1: Brand */}
            <div className="footer-brand-col">
              <div className="footer-logo">
                <div className="logo-icon-wrap sm">
                  <Wrench size={20} className="logo-icon" />
                </div>
                <span className="logo-text">
                  Road<span className="logo-highlight">Rescue</span>
                </span>
              </div>
              <p className="footer-tagline">
                When your vehicle stops, help shouldn&apos;t.
              </p>
              <div className="footer-social-icons">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="Github">
                  <Github size={18} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="Twitter">
                  <Twitter size={18} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-btn" aria-label="LinkedIn">
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Services */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Services</h4>
              <ul className="footer-links-list">
                <li><Link to="/register">Find Mechanics</Link></li>
                <li><Link to="/register">Spare Parts Assistance</Link></li>
                <li><Link to="/register">Vehicle Towing</Link></li>
                <li><Link to="/register">Emergency Roadside Support</Link></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div className="footer-links-col">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links-list">
                <li><a href="#about" onClick={(e) => handleNavClick(e, 'about')}>About Us</a></li>
                <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a></li>
                <li><a href="#services" onClick={(e) => handleNavClick(e, 'services')}>Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="footer-links-col" id="contact">
              <h4 className="footer-heading">Contact</h4>
              <ul className="footer-contact-list">
                <li className="contact-item">
                  <Mail size={16} className="contact-icon" />
                  <a href="mailto:support@roadrescue.in">support@roadrescue.in</a>
                </li>
                <li className="contact-item">
                  <Phone size={16} className="contact-icon" />
                  <a href="tel:+9118001234567">+91 1800 XXX XXXX</a>
                </li>
                <li className="contact-item">
                  <MapPin size={16} className="contact-icon" />
                  <span>Tech Innovation Park, Sector 62, Noida, UP, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom-bar">
            <p className="copyright-text">
              © 2024 RoadRescue. Academic Project | MCA Program. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <a href="#privacy">Privacy Policy</a>
              <span>•</span>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
