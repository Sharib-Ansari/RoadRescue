import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Store,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { authApi } from '../utils/api';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.getMyOrders();
      if (res?.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this order? Stock will be restored to the shop.');
    if (!confirmCancel) return;

    try {
      const res = await authApi.updateOrderStatus(orderId, 'cancelled', 'Cancelled by customer');
      if (res?.success) {
        setSuccessMsg('Your order was cancelled successfully.');
        fetchOrders();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return { label: 'Order Placed', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' };
      case 'confirmed':
        return { label: 'Confirmed by Shop', bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: '#8B5CF6' };
      case 'preparing':
        return { label: 'Preparing Parts', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: '#F59E0B' };
      case 'out_for_delivery':
        return { label: 'Out for Delivery', bg: 'rgba(236, 72, 153, 0.15)', text: '#F472B6', border: '#EC4899' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: '#10B981' };
      case 'completed':
        return { label: 'Delivered / Collected', bg: 'rgba(16, 185, 129, 0.2)', text: '#10B981', border: '#10B981' };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', border: '#EF4444' };
      default:
        return { label: status, bg: '#232731', text: '#9CA3AF', border: '#303641' };
    }
  };

  return (
    <DashboardLayout title="My Spare Parts Orders">
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F3F4F6', margin: 0 }}>
              My Orders & Dispatches
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.25rem', margin: 0 }}>
              Track the progress of your vehicle spare parts orders and pickup status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to="/spare-parts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#EF4444',
                color: '#fff',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <Package size={16} />
              <span>Browse Parts</span>
            </Link>
            <button
              type="button"
              onClick={fetchOrders}
              style={{
                padding: '0.6rem',
                backgroundColor: '#181B22',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
              title="Refresh Orders"
            >
              <RefreshCw size={16} />
            </button>
          </div>
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

        {/* Orders Listing */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner size="lg" message="Loading your order history..." />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', padding: '4rem', border: '1px solid #2B313E' }}>
            <EmptyState
              icon={ShoppingBag}
              title="No Orders Placed Yet"
              description="You have not placed any spare parts orders. Order genuine replacement parts directly from local partner auto stores."
              actionText="Explore Spare Parts Store"
              onAction={() => {}}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map((ord) => {
              const badge = getStatusBadge(ord.orderStatus);
              const isDelivery = ord.fulfillmentMethod === 'home_delivery';
              const canCancel = ord.orderStatus === 'placed';

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
                  {/* Card Header: Order #, Status, Date */}
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

                    <div style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                      Placed on {formatDate(ord.createdAt)}
                    </div>
                  </div>

                  {/* Fulfilling Shop */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', color: '#93C5FD' }}>
                    <Store size={16} />
                    <span>Store: <strong>{ord.shopId?.name || 'Auto Spares Shop'}</strong> ({ord.shopId?.city})</span>
                  </div>

                  {/* Items Ordered List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#111318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #232731' }}>
                    {ord.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#E5E7EB' }}>
                          <Package size={15} color="#60A5FA" />
                          <span><strong>{item.quantity}×</strong> {item.productName} ({item.brand})</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10B981' }}>
                          ₹{Number(item.lineTotal).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Breakdown & Footer Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Total Amount:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                        ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                        ({ord.paymentStatus === 'completed' ? 'Paid' : 'Payment Pending on Fulfillment'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(ord._id || ord.id)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#EF4444',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel Order
                        </button>
                      )}
                      <Link
                        to={`/orders/${ord._id || ord.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#2563EB',
                          color: '#fff',
                          padding: '0.45rem 1rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        <Eye size={14} />
                        <span>Track Status</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
