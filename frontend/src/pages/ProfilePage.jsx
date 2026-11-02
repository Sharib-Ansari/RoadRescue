import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Lock
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import MechanicDashboardLayout from '../layouts/MechanicDashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getInitials, formatDate } from '../utils/helpers';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const isMechanic = (user?.role || user?.accountType) === 'mechanic';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [workshopName, setWorkshopName] = useState(user?.workshopName || '');
  const [serviceArea, setServiceArea] = useState(user?.serviceArea || '');
  const [experienceYears, setExperienceYears] = useState(user?.experienceYears || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || 'Sunita Sharma');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || '+91 98111 55667');
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [emailInvoices, setEmailInvoices] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUser({
      name,
      phone,
      workshopName,
      serviceArea,
      experienceYears,
      emergencyContactName,
      emergencyContactPhone,
      smsAlerts,
      emailInvoices
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const Layout = isMechanic ? MechanicDashboardLayout : DashboardLayout;

  return (
    <Layout title={isMechanic ? "Mechanic Profile" : "My Profile"}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account & Safety Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Manage your personal credentials, contact info, and emergency ICE alert recipients
          </p>
        </div>

        {/* User Card Overview */}
        <div
          className="card"
          style={{
            padding: '1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-secondary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}
          >
            {getInitials(user?.name)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{user?.name || 'Road User'}</h2>
              <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                {user?.accountType || 'Driver'} Member
              </span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              {user?.email} • {user?.phone}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Member since: {formatDate(user?.joinDate || new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem' }}>
          {savedSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--success-light)',
                border: '1px solid var(--success)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--success)',
                fontSize: '0.875rem',
                marginBottom: '1.5rem'
              }}
            >
              <CheckCircle2 size={18} />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Personal Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              className="form-input"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
              value={user?.email || ''}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                In Case of Emergency (ICE) Contact
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              We will automatically notify this person via automated SMS if you press the SOS Emergency button.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Contact Person Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Spouse, Parent, Sibling"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 00000"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
              Notifications & Alerts
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                Receive live SMS mechanic dispatch updates and GPS coordinates
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={emailInvoices}
                  onChange={(e) => setEmailInvoices(e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                Email copies of GST invoices and inspection diagnostics reports
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-lg">
              <Save size={18} /> Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfilePage;
