import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Store,
  Truck,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Printer
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { authApi } from '../utils/api';
import { formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'dispatch', label: 'Dispatch / Ready' },
  { key: 'completed', label: 'Completed' }
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await authApi.getOrderById(id);
        if (res?.success) {
          setOrder(res.order);
        }
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Order Details">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" message="Loading order details..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout title="Order Details">
        <div style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '2.5rem' }}>
          <AlertTriangle size={40} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#F3F4F6', margin: '0 0 0.5rem' }}>Order Not Found</h2>
          <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>{error || 'Unable to locate order information or access was denied.'}</p>
          <Link to="/my-orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#374151', color: '#fff', padding: '0.65rem 1.25rem', borderRadius: '8px', textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>Back to Orders</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isDelivery = order.fulfillmentMethod === 'home_delivery';
  const isCancelled = order.orderStatus === 'cancelled';

  // Helper to determine step status
  const getStepState = (stepKey) => {
    if (isCancelled) return 'cancelled';
    const status = order.orderStatus;
    const hierarchy = ['placed', 'confirmed', 'preparing', isDelivery ? 'out_for_delivery' : 'ready_for_pickup', 'completed'];

    let mappedKey = stepKey;
    if (stepKey === 'dispatch') {
      mappedKey = isDelivery ? 'out_for_delivery' : 'ready_for_pickup';
    }

    const currentIndex = hierarchy.indexOf(status);
    const stepIndex = hierarchy.indexOf(mappedKey);

    if (stepIndex <= currentIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <DashboardLayout title={`Order #${order.orderNumber}`}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/my-orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#9CA3AF', textDecoration: 'none', fontSize: '0.85rem' }}>
              <ArrowLeft size={15} />
              <span>Back to My Orders</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F3F4F6', margin: 0, fontFamily: 'monospace' }}>
                {order.orderNumber}
              </h1>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.15)' : order.orderStatus === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                  border: `1px solid ${isCancelled ? '#EF4444' : order.orderStatus === 'completed' ? '#10B981' : '#3B82F6'}`,
                  color: isCancelled ? '#EF4444' : order.orderStatus === 'completed' ? '#10B981' : '#60A5FA',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {order.orderStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
              Ordered on {formatDate(order.createdAt)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#181B22',
              border: '1px solid #303641',
              color: '#D1D5DB',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} />
            <span>Print Invoice</span>
          </button>
        </div>

        {/* Progress Tracker (unless cancelled) */}
        {!isCancelled ? (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
              {STEPS.map((s, idx) => {
                const state = getStepState(s.key);
                const isStepCompleted = state === 'completed';
                const label = s.key === 'dispatch' ? (isDelivery ? 'Out for Delivery' : 'Ready for Pickup') : s.label;

                return (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isStepCompleted ? '#10B981' : '#111318',
                        border: `2px solid ${isStepCompleted ? '#10B981' : '#303641'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isStepCompleted ? '#fff' : '#6B7280',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isStepCompleted ? '✓' : idx + 1}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: isStepCompleted ? 700 : 500, color: isStepCompleted ? '#F3F4F6' : '#9CA3AF', marginTop: '0.5rem', textAlign: 'center' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#FCA5A5' }}>
            <XCircle size={22} color="#EF4444" />
            <div>
              <div style={{ fontWeight: 700 }}>This order has been cancelled</div>
              <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Reason: {order.cancellationReason || 'Cancelled by user/store'}. Stock was safely restored.
              </div>
            </div>
          </div>
        )}

        {/* 2-Column Info: Items Snapshot & Delivery/Store Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Items & Financial Breakdown */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
              Items Ordered ({order.items.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: idx < order.items.length - 1 ? '1px solid #232731' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#F3F4F6', fontSize: '0.9rem' }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Brand: {item.brand} • SKU: {item.SKU}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.15rem' }}>
                      Qty: {item.quantity} × ₹{item.unitPrice}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.95rem' }}>
                    ₹{item.lineTotal}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #2B313E', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                <span>Subtotal</span>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>₹{order.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                <span>Delivery Fee</span>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>
                  {order.deliveryCharge > 0 ? `₹${order.deliveryCharge}` : 'FREE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', paddingTop: '0.5rem', borderTop: '1px solid #232731' }}>
                <span>Total Amount</span>
                <span style={{ color: '#10B981' }}>₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Payment Method & Status */}
            <div style={{ backgroundColor: '#111318', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2B313E', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#D1D5DB' }}>
                <CreditCard size={15} color="#10B981" />
                <span>Payment: <strong>{order.paymentMethod.replace(/_/g, ' ')}</strong></span>
              </div>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: order.paymentStatus === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: order.paymentStatus === 'completed' ? '#10B981' : '#FBBF24', fontWeight: 700 }}>
                {order.paymentStatus === 'completed' ? 'Paid' : 'Pending on Fulfillment'}
              </span>
            </div>
          </div>

          {/* Fulfillment & Shop Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Fulfillment Address or Pickup Card */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDelivery ? '#60A5FA' : '#34D399', fontWeight: 700, fontSize: '1rem' }}>
                {isDelivery ? <Truck size={18} /> : <Store size={18} />}
                <span>{isDelivery ? 'Home Delivery Destination' : 'Shop Pickup Instructions'}</span>
              </div>

              {isDelivery ? (
                <div style={{ color: '#D1D5DB', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: '#F3F4F6' }}>{order.customerId?.name}</div>
                  <div>{order.deliveryAddress?.street}</div>
                  <div>{order.deliveryAddress?.city} - {order.deliveryAddress?.pinCode}</div>
                  <div style={{ marginTop: '0.35rem', color: '#9CA3AF' }}>
                    Phone: {order.deliveryAddress?.contactPhone}
                  </div>
                  {order.deliveryAddress?.notes && (
                    <div style={{ marginTop: '0.35rem', fontStyle: 'italic', color: '#9CA3AF', fontSize: '0.8rem' }}>
                      Instructions: {order.deliveryAddress.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: '#D1D5DB', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, color: '#F3F4F6' }}>{order.shopId?.name}</div>
                  <div>{order.pickupDetails?.shopAddress || order.shopId?.address}</div>
                  <div>{order.pickupDetails?.shopCity || order.shopId?.city} - {order.pickupDetails?.shopPinCode || order.shopId?.pinCode}</div>
                  <div style={{ marginTop: '0.5rem', padding: '0.65rem', backgroundColor: '#111318', borderRadius: '6px', fontSize: '0.8rem', color: '#93C5FD' }}>
                    Show Order Number <strong>{order.orderNumber}</strong> at the shop counter.
                  </div>
                </div>
              )}
            </div>

            {/* Shop Details */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>
                Fulfilling Auto Store
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F3F4F6' }}>
                {order.shopId?.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#D1D5DB' }}>
                <MapPin size={15} color="#9CA3AF" />
                <span>{order.shopId?.address}, {order.shopId?.city}</span>
              </div>
              {order.shopId?.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#9CA3AF' }}>
                  <Phone size={15} />
                  <span>{order.shopId.phone}</span>
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600 }}>
                Status History
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {order.statusHistory?.map((h, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3B82F6', marginTop: '5px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#F3F4F6', textTransform: 'capitalize' }}>
                        {h.status.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                        {formatDate(h.timestamp)} {h.note ? `• ${h.note}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
