import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Truck,
  Store,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  Eye,
  RefreshCw,
  Package
} from 'lucide-react';
import ShopDashboardLayout from '../layouts/ShopDashboardLayout';
import { authApi } from '../utils/api';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Orders' },
  { value: 'placed', label: 'Placed' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedMethod !== 'all') params.fulfillmentMethod = selectedMethod;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await authApi.getShopOrders(params);
      if (res?.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load shop orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedMethod]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      let notes = '';
      let reason = '';
      if (newStatus === 'cancelled') {
        const inputReason = window.prompt('Please enter a cancellation reason:');
        if (!inputReason) return;
        reason = inputReason;
      }

      const res = await authApi.updateOrderStatus(orderId, newStatus, notes);
      if (res?.success) {
        setSuccessMsg(`Order updated to "${newStatus}" successfully.`);
        fetchOrders();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return { label: 'New Order', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' };
      case 'confirmed':
        return { label: 'Confirmed', bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: '#8B5CF6' };
      case 'preparing':
        return { label: 'Preparing', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: '#F59E0B' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: '#EC4899' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '#10B981' };
      case 'completed':
        return { label: 'Completed', bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', border: '#10B981' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
      default:
        return { label: status, bg: '#232731', text: '#9CA3AF', border: '#303641' };
    }
  };

  return (
    <ShopDashboardLayout title="Orders Management">
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F3F4F6', margin: 0 }}>
              Shop Orders Management
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.25rem', margin: 0 }}>
              Process customer spare parts orders, update fulfillment workflow, and manage dispatches.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#181B22',
              color: '#D1D5DB',
              border: '1px solid #303641',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#181B22', padding: '1rem', borderRadius: '12px', border: '1px solid #2B313E', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Search by Order # (e.g. RR-ORD-123456)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  backgroundColor: '#111318',
                  border: '1px solid #303641',
                  borderRadius: '8px',
                  color: '#E5E7EB',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: '#374151',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Method Dropdown */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Methods</option>
              <option value="home_delivery">Home Delivery</option>
              <option value="shop_pickup">Shop Pickup</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner size="lg" message="Loading shop orders..." />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', padding: '3.5rem', border: '1px solid #2B313E' }}>
            <EmptyState
              icon={ShoppingBag}
              title="No Orders Found"
              description="No customer orders found matching your search or filter criteria."
              actionText="Reset Filters"
              onAction={() => {
                setSelectedStatus('all');
                setSelectedMethod('all');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map((ord) => {
              const badge = getStatusBadge(ord.orderStatus);
              const isDelivery = ord.fulfillmentMethod === 'home_delivery';

              return (
                <div
                  key={ord._id || ord.id}
                  style={{
                    backgroundColor: '#181B22',
                    borderRadius: '12px',
                    border: '1px solid #2B313E',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Top Row: Order #, Status, Date, Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #232731', paddingBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Link to={`/orders/${ord._id || ord.id}`} style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'monospace', color: '#60A5FA', textDecoration: 'none' }}>
                        {ord.orderNumber}
                      </Link>
                      <span
                        style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '20px',
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.text,
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}
                      >
                        {badge.label}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          backgroundColor: isDelivery ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isDelivery ? '#60A5FA' : '#34D399',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {isDelivery ? <Truck size={13} /> : <Store size={13} />}
                        <span>{isDelivery ? 'Home Delivery' : 'Shop Pickup'}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                        {formatDate(ord.createdAt)}
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>
                        ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: Customer Info & Fulfillment Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                    {/* Customer Info */}
                    <div style={{ backgroundColor: '#111318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #232731' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                        Customer Details
                      </div>
                      <div style={{ fontWeight: 600, color: '#F3F4F6' }}>
                        {ord.customerId?.name || 'Customer'}
                      </div>
                      <div style={{ color: '#9CA3AF', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Phone size={13} />
                        <span>{ord.customerId?.phone || 'No phone'}</span>
                      </div>
                    </div>

                    {/* Delivery Address or Pickup Notice */}
                    <div style={{ backgroundColor: '#111318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #232731' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                        {isDelivery ? 'Delivery Destination' : 'Pickup Instructions'}
                      </div>
                      {isDelivery ? (
                        <div style={{ color: '#D1D5DB' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                            <MapPin size={14} color="#9CA3AF" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>{ord.deliveryAddress?.street}, {ord.deliveryAddress?.city} - {ord.deliveryAddress?.pinCode}</span>
                          </div>
                          {ord.deliveryAddress?.notes && (
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                              Note: {ord.deliveryAddress.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#34D399', fontSize: '0.82rem' }}>
                          Customer will collect at counter with Order #{ord.orderNumber}.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: '#111318', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #232731' }}>
                    {ord.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#D1D5DB' }}>
                        <Package size={14} color="#60A5FA" />
                        <span><strong>{item.quantity}×</strong> {item.productName} ({item.brand})</span>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>₹{item.lineTotal}</span>
                        {idx < ord.items.length - 1 && <span style={{ color: '#4B5563', margin: '0 0.35rem' }}>•</span>}
                      </div>
                    ))}
                  </div>

                  {/* Bottom Row: Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                    <Link to={`/orders/${ord._id || ord.id}`} style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Eye size={15} />
                      <span>Full Order Details & Timeline</span>
                    </Link>

                    {/* Status Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {ord.orderStatus === 'placed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord._id || ord.id, 'confirmed')}
                          style={{ padding: '0.45rem 0.9rem', backgroundColor: '#3B82F6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Confirm Order
                        </button>
                      )}
                      {ord.orderStatus === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord._id || ord.id, 'preparing')}
                          style={{ padding: '0.45rem 0.9rem', backgroundColor: '#F59E0B', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark Preparing
                        </button>
                      )}
                      {ord.orderStatus === 'preparing' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord._id || ord.id, isDelivery ? 'out_for_delivery' : 'ready_for_pickup')}
                          style={{ padding: '0.45rem 0.9rem', backgroundColor: isDelivery ? '#EC4899' : '#10B981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {isDelivery ? 'Mark Out for Delivery' : 'Mark Ready for Pickup'}
                        </button>
                      )}
                      {(ord.orderStatus === 'out_for_delivery' || ord.orderStatus === 'ready_for_pickup') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord._id || ord.id, 'completed')}
                          style={{ padding: '0.45rem 0.9rem', backgroundColor: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Mark as Completed
                        </button>
                      )}

                      {/* Cancel action if not completed or cancelled */}
                      {ord.orderStatus !== 'completed' && ord.orderStatus !== 'cancelled' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord._id || ord.id, 'cancelled')}
                          style={{ padding: '0.45rem 0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#EF4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShopDashboardLayout>
  );
}
