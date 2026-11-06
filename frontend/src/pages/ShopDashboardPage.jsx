import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Store,
  Truck,
  ArrowRight,
  PlusCircle,
  Eye,
  RefreshCw,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import ShopDashboardLayout from '../layouts/ShopDashboardLayout';
import { authApi } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function ShopDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    shop: null,
    stats: {
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalRevenue: 0
    },
    recentOrders: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.getShopDashboardStats();
      if (res?.success) {
        setData(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load shop dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await authApi.updateOrderStatus(orderId, newStatus);
      fetchDashboardData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'placed':
        return { label: 'New Order', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: '#3B82F6' };
      case 'confirmed':
        return { label: 'Confirmed', bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: '#8B5CF6' };
      case 'preparing':
        return { label: 'Preparing Parts', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: '#F59E0B' };
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

  if (loading) {
    return (
      <ShopDashboardLayout title="Shop Overview">
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <LoadingSpinner size="lg" message="Loading your shop dashboard..." />
        </div>
      </ShopDashboardLayout>
    );
  }

  const { shop, stats, recentOrders } = data;

  return (
    <ShopDashboardLayout title="Shop Overview">
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Welcome & Shop Status Header */}
        <div style={{ backgroundColor: '#181B22', borderRadius: '14px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={26} color="#3B82F6" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#F3F4F6' }}>
                  {shop?.name || 'My Spare Parts Shop'}
                </h2>
                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', fontSize: '0.72rem', fontWeight: 700 }}>
                  Active Store
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                {shop?.city} • Standard Delivery Fee: ₹{shop?.deliveryCharge || 0} • {shop?.acceptsHomeDelivery ? 'Home Delivery' : ''} {shop?.acceptsShopPickup ? '• Shop Pickup' : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              to="/shop/products?new=1"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              <PlusCircle size={16} />
              <span>Add Product</span>
            </Link>
            <button
              type="button"
              onClick={fetchDashboardData}
              style={{
                padding: '0.6rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Total Revenue */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Total Revenue</span>
              <DollarSign size={18} color="#10B981" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10B981', marginTop: '0.5rem' }}>
              ₹{Number(stats.totalRevenue).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
              From completed customer orders
            </div>
          </div>

          {/* Pending Orders */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Pending Orders</span>
              <Clock size={18} color="#F59E0B" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FBBF24', marginTop: '0.5rem' }}>
              {stats.pendingOrders}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
              Needs confirmation / fulfillment
            </div>
          </div>

          {/* Total Orders */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Total Orders</span>
              <ShoppingBag size={18} color="#3B82F6" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60A5FA', marginTop: '0.5rem' }}>
              {stats.totalOrders}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
              {stats.completedOrders} completed • {stats.cancelledOrders} cancelled
            </div>
          </div>

          {/* Inventory Count & Low Stock Alert */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>Inventory Parts</span>
              <Package size={18} color="#A78BFA" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F3F4F6', marginTop: '0.5rem' }}>
              {stats.totalProducts}
            </div>
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: stats.lowStockProducts > 0 ? '#F59E0B' : '#9CA3AF', fontWeight: stats.lowStockProducts > 0 ? 700 : 400 }}>
              {stats.lowStockProducts > 0 ? `⚠️ ${stats.lowStockProducts} item(s) low on stock` : `${stats.activeProducts} active on marketplace`}
            </div>
          </div>
        </div>

        {/* Recent Orders Section */}
        <div style={{ backgroundColor: '#181B22', borderRadius: '14px', border: '1px solid #2B313E', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2B313E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F3F4F6' }}>
                Recent Customer Orders
              </h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#9CA3AF' }}>
                Latest orders requiring preparation and delivery.
              </p>
            </div>
            <Link
              to="/shop/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#60A5FA',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              <span>View All Orders</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No orders received yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Customer orders placed from the marketplace will appear here in real-time.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2B313E', color: '#9CA3AF', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Order Number</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Fulfillment</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Total</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => {
                    const badge = getStatusBadge(ord.orderStatus);
                    const isDelivery = ord.fulfillmentMethod === 'home_delivery';

                    return (
                      <tr key={ord._id || ord.id} style={{ borderBottom: '1px solid #232731' }}>
                        {/* Order Number & Date */}
                        <td style={{ padding: '1rem' }}>
                          <Link to={`/orders/${ord._id || ord.id}`} style={{ fontWeight: 700, fontFamily: 'monospace', color: '#60A5FA', textDecoration: 'none' }}>
                            {ord.orderNumber}
                          </Link>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
                            {formatDate(ord.createdAt)}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#F3F4F6' }}>
                            {ord.customerId?.name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                            {ord.customerId?.phone || 'No phone'}
                          </div>
                        </td>

                        {/* Fulfillment */}
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.55rem',
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
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#10B981' }}>
                          ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '20px',
                              backgroundColor: badge.bg,
                              border: `1px solid ${badge.border}`,
                              color: badge.text,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-block'
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Quick Status Action Button */}
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          {ord.orderStatus === 'placed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ord._id || ord.id, 'confirmed')}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: '#3B82F6', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Confirm
                            </button>
                          )}
                          {ord.orderStatus === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ord._id || ord.id, 'preparing')}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: '#F59E0B', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Prepare
                            </button>
                          )}
                          {ord.orderStatus === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ord._id || ord.id, isDelivery ? 'out_for_delivery' : 'ready_for_pickup')}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: isDelivery ? '#EC4899' : '#10B981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {isDelivery ? 'Dispatch' : 'Ready'}
                            </button>
                          )}
                          {(ord.orderStatus === 'out_for_delivery' || ord.orderStatus === 'ready_for_pickup') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(ord._id || ord.id, 'completed')}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: '#10B981', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Complete
                            </button>
                          )}
                          {ord.orderStatus === 'completed' && (
                            <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Fulfilled</span>
                          )}
                          {ord.orderStatus === 'cancelled' && (
                            <span style={{ fontSize: '0.75rem', color: '#EF4444' }}>Cancelled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ShopDashboardLayout>
  );
}
