export const generateId = () => `RR-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

export const getInitials = (name) => {
  if (!name) return 'U';
  return name.trim().split(/\s+/).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePhone = (phone) => {
  if (!phone) return false;
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, '').replace(/^\+91/, ''));
};

export const getStatusColor = (status) => {
  const colors = {
    'submitted': '#F59E0B',
    'accepted': '#3B82F6',
    'on_the_way': '#8B5CF6',
    'arrived': '#22C55E',
    'completed': '#22C55E',
    'cancelled': '#EF4444',
    'pending': '#F59E0B'
  };
  return colors[status] || '#9CA3AF';
};

export const getStatusLabel = (status) => {
  const labels = {
    'submitted': 'Request Submitted',
    'accepted': 'Mechanic Accepted',
    'on_the_way': 'Mechanic On The Way',
    'arrived': 'Mechanic Arrived',
    'completed': 'Service Completed',
    'cancelled': 'Cancelled',
    'pending': 'Pending'
  };
  return labels[status] || status;
};
