import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  Store,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Package,
  ShieldCheck,
  FileText
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    currentShop,
    cartTotal,
    clearCart,
    totalItems
  } = useCart();

  const [fulfillmentMethod, setFulfillmentMethod] = useState(() => {
    if (currentShop && !currentShop.acceptsHomeDelivery && currentShop.acceptsShopPickup) {
      return 'shop_pickup';
    }
    return 'home_delivery';
  });

  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: currentShop?.city || '',
    pinCode: currentShop?.pinCode || '',
    contactPhone: user?.phone || '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const deliveryCharge = fulfillmentMethod === 'home_delivery' ? (currentShop?.deliveryCharge || 0) : 0;
  const grandTotal = cartTotal + deliveryCharge;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (fulfillmentMethod === 'home_delivery') {
      if (!deliveryAddress.street.trim()) {
        setError('Please enter your delivery street address');
        return false;
      }
      if (!deliveryAddress.city.trim()) {
        setError('Please enter your delivery city');
        return false;
      }
      if (!deliveryAddress.pinCode.trim()) {
        setError('Please enter a 6-digit delivery PIN code');
        return false;
      }
      if (!deliveryAddress.contactPhone.trim()) {
        setError('Please enter a contact phone number for delivery updates');
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!currentShop?.id) {
      setError('No fulfilling shop identified. Please review your cart.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderPayload = {
        shopId: currentShop.id,
        fulfillmentMethod,
        items: cartItems.map((item) => ({
          productId: item._id || item.id,
          name: item.name,
          quantity: item.quantity
        })),
        deliveryAddress: fulfillmentMethod === 'home_delivery' ? deliveryAddress : undefined
      };

      const res = await authApi.createOrder(orderPayload);
      if (res?.success && res.order) {
        setPlacedOrder(res.order);
        clearCart();
      } else {
        throw new Error(res?.message || 'Failed to place order');
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <DashboardLayout title="Order Confirmation">
        <div style={{ maxWidth: '640px', margin: '2rem auto', textAlign: 'center', backgroundColor: '#181B22', borderRadius: '16px', border: '1px solid #2B313E', padding: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <CheckCircle2 size={36} color="#10B981" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F3F4F6', margin: '0 0 0.5rem' }}>
            Order Placed Successfully!
          </h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
            Your order number is <strong style={{ color: '#60A5FA', fontFamily: 'monospace' }}>{placedOrder.orderNumber}</strong>. The shop has received your request and will prepare your parts.
          </p>

          <div style={{ backgroundColor: '#111318', borderRadius: '10px', padding: '1.25rem', textAlign: 'left', marginBottom: '1.75rem', border: '1px solid #2B313E', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#9CA3AF' }}>Fulfillment Method:</span>
              <strong style={{ color: '#F3F4F6', textTransform: 'capitalize' }}>
                {placedOrder.fulfillmentMethod === 'home_delivery' ? 'Home Delivery' : 'Shop Pickup'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#9CA3AF' }}>Total Amount:</span>
              <strong style={{ color: '#10B981', fontSize: '1.1rem' }}>
                ₹{Number(placedOrder.totalAmount).toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9CA3AF' }}>Payment Status:</span>
              <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', fontSize: '0.75rem', fontWeight: 700 }}>
                Pending on Delivery / Pickup
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/my-orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#2563EB',
                color: '#fff',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <FileText size={18} />
              <span>View My Orders</span>
            </Link>
            <Link
              to="/spare-parts"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#374151',
                color: '#D1D5DB',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>Back to Marketplace</span>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (cartItems.length === 0) {
    return (
      <DashboardLayout title="Checkout">
        <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: '#181B22', borderRadius: '14px', border: '1px solid #2B313E', padding: '3rem' }}>
          <Package size={48} color="#6B7280" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#F3F4F6', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Your cart is empty</h2>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Add vehicle spare parts from our marketplace before proceeding to checkout.</p>
          <Link
            to="/spare-parts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#EF4444',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <span>Browse Spare Parts</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Checkout">
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Navigation back */}
        <div>
          <Link to="/spare-parts" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#9CA3AF', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} />
            <span>Back to Parts Marketplace</span>
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F3F4F6', margin: '0.5rem 0 0' }}>
            Secure Checkout
          </h1>
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1.15rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Fulfillment & Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Fulfillment Method Selection */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
                1. Select Fulfillment Method
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Home Delivery Card */}
                <label
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: `2px solid ${fulfillmentMethod === 'home_delivery' ? '#EF4444' : '#2B313E'}`,
                    backgroundColor: fulfillmentMethod === 'home_delivery' ? 'rgba(239, 68, 68, 0.08)' : '#111318',
                    cursor: currentShop?.acceptsHomeDelivery ? 'pointer' : 'not-allowed',
                    opacity: currentShop?.acceptsHomeDelivery ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#F3F4F6' }}>
                      <Truck size={20} color={fulfillmentMethod === 'home_delivery' ? '#EF4444' : '#9CA3AF'} />
                      <span>Home Delivery</span>
                    </div>
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="home_delivery"
                      checked={fulfillmentMethod === 'home_delivery'}
                      disabled={!currentShop?.acceptsHomeDelivery}
                      onChange={() => setFulfillmentMethod('home_delivery')}
                      style={{ accentColor: '#EF4444' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Delivered directly to your home or breakdown location. Delivery fee: ₹{currentShop?.deliveryCharge || 0}
                  </p>
                </label>

                {/* Shop Pickup Card */}
                <label
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    border: `2px solid ${fulfillmentMethod === 'shop_pickup' ? '#EF4444' : '#2B313E'}`,
                    backgroundColor: fulfillmentMethod === 'shop_pickup' ? 'rgba(239, 68, 68, 0.08)' : '#111318',
                    cursor: currentShop?.acceptsShopPickup ? 'pointer' : 'not-allowed',
                    opacity: currentShop?.acceptsShopPickup ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#F3F4F6' }}>
                      <Store size={20} color={fulfillmentMethod === 'shop_pickup' ? '#EF4444' : '#9CA3AF'} />
                      <span>Shop Pickup</span>
                    </div>
                    <input
                      type="radio"
                      name="fulfillmentMethod"
                      value="shop_pickup"
                      checked={fulfillmentMethod === 'shop_pickup'}
                      disabled={!currentShop?.acceptsShopPickup}
                      onChange={() => setFulfillmentMethod('shop_pickup')}
                      style={{ accentColor: '#EF4444' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Collect directly at the shop counter. ₹0 delivery fee. Ready once prepared.
                  </p>
                </label>
              </div>
            </div>

            {/* Address or Pickup Location Details */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem' }}>
              {fulfillmentMethod === 'home_delivery' ? (
                <>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
                    2. Delivery Address
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                        Street Address / Landmark *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={deliveryAddress.street}
                        onChange={handleInputChange}
                        placeholder="House / Flat No., Street, Landmark"
                        required
                        style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={deliveryAddress.city}
                          onChange={handleInputChange}
                          placeholder="e.g. New Delhi"
                          required
                          style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                          PIN Code *
                        </label>
                        <input
                          type="text"
                          name="pinCode"
                          value={deliveryAddress.pinCode}
                          onChange={handleInputChange}
                          placeholder="110001"
                          maxLength={6}
                          required
                          style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                        Contact Phone for Delivery *
                      </label>
                      <input
                        type="tel"
                        name="contactPhone"
                        value={deliveryAddress.contactPhone}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        required
                        style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                        Delivery Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        name="notes"
                        value={deliveryAddress.notes}
                        onChange={handleInputChange}
                        placeholder="e.g. Leave with security guard or call upon arrival"
                        style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
                    2. Shop Pickup Location
                  </h3>

                  <div style={{ backgroundColor: '#111318', padding: '1.25rem', borderRadius: '10px', border: '1px solid #2B313E', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60A5FA', fontWeight: 700, fontSize: '1.05rem' }}>
                      <Store size={20} />
                      <span>{currentShop?.name}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#D1D5DB', fontSize: '0.875rem' }}>
                      <MapPin size={16} color="#9CA3AF" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{currentShop?.address}, {currentShop?.city} - {currentShop?.pinCode}</span>
                    </div>

                    {currentShop?.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
                        <Phone size={15} />
                        <span>Shop Phone: {currentShop.phone}</span>
                      </div>
                    )}

                    <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: '#93C5FD' }}>
                      <strong>Pickup Instructions:</strong> Show your Order Number at the shop counter once the status updates to &quot;Ready for Pickup&quot;.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method Notice */}
            <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.85rem', fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
                3. Payment Method
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem', backgroundColor: '#111318', borderRadius: '8px', border: '1px solid #2B313E' }}>
                <CreditCard size={20} color="#10B981" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#F3F4F6', fontSize: '0.9rem' }}>
                    {fulfillmentMethod === 'home_delivery' ? 'Cash on Delivery (COD)' : 'Pay at Shop Counter'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Payment status will remain &quot;Pending&quot; until payment is handed over at fulfillment.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order Button */}
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F3F4F6' }}>
              Order Summary ({totalItems} items)
            </h3>

            {/* Items Mini List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '220px', overflowY: 'auto' }}>
              {cartItems.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                    <div style={{ flex: 1, paddingRight: '0.5rem', minWidth: 0 }}>
                      <div style={{ color: '#F3F4F6', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                        Qty: {item.quantity} × ₹{Number(item.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ color: '#10B981', fontWeight: 700 }}>
                      ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid #2B313E', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                <span>Subtotal</span>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF' }}>
                <span>Delivery Fee</span>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>
                  {deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE (Pickup)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', paddingTop: '0.65rem', borderTop: '1px solid #232731' }}>
                <span>Total Amount</span>
                <span style={{ color: '#10B981' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.85rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                transition: 'background 0.2s ease'
              }}
            >
              {isSubmitting ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>Place Order (₹{grandTotal.toLocaleString('en-IN')})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9CA3AF', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#10B981" />
              <span>Genuine parts backed by shop guarantee</span>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
